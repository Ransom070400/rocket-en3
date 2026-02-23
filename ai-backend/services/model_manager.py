"""
ModelManager: Initializes, trains, and serves all ML models.
- RiskModel: XGBoost anti-scalping classifier
- RatingModel: Organizer reputation weighted scorer
- PreferenceModel: User category preference learning
"""
import logging
import pickle
from pathlib import Path

import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from utils.synthetic_data import generate_risk_data, generate_rating_data

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).parent / "saved_models"


class RiskModel:
    """
    Anti-Scalping Risk Engine
    Features:
      - wallet_age_days: age of wallet in days
      - purchase_velocity: tickets bought in last 24h
      - resale_time_hours: avg hours before resale (0 if never resold)
      - transfer_count: total transfers of wallet's tickets
      - gas_multiplier: how much above base gas user pays (bots pay more)
      - cluster_score: similarity to known scalper cluster (0-1)
      - loyalty_points: on-chain loyalty (higher = lower risk)
    """

    FEATURE_NAMES = [
        "wallet_age_days",
        "purchase_velocity",
        "resale_time_hours",
        "transfer_count",
        "gas_multiplier",
        "cluster_score",
        "loyalty_points",
    ]

    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.model_path = MODEL_DIR / "risk_model.pkl"
        self.scaler_path = MODEL_DIR / "risk_scaler.pkl"

    def train(self):
        logger.info("Training Risk Model...")
        X, y = generate_risk_data(n_samples=10000)

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        X_train_s = self.scaler.fit_transform(X_train)
        X_test_s  = self.scaler.transform(X_test)

        self.model = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            use_label_encoder=False,
            eval_metric="logloss",
            random_state=42,
        )
        self.model.fit(X_train_s, y_train, eval_set=[(X_test_s, y_test)], verbose=False)

        acc = self.model.score(X_test_s, y_test)
        logger.info(f"Risk Model accuracy: {acc:.3f}")

        MODEL_DIR.mkdir(exist_ok=True)
        with open(self.model_path, "wb") as f:
            pickle.dump(self.model, f)
        with open(self.scaler_path, "wb") as f:
            pickle.dump(self.scaler, f)

    def load(self):
        with open(self.model_path, "rb") as f:
            self.model = pickle.load(f)
        with open(self.scaler_path, "rb") as f:
            self.scaler = pickle.load(f)

    def score(self, features: dict) -> int:
        """Return risk score 0-100."""
        x = np.array([[features[k] for k in self.FEATURE_NAMES]])
        x_s = self.scaler.transform(x)
        prob = self.model.predict_proba(x_s)[0][1]  # probability of being scalper
        return int(round(prob * 100))


class PreferenceModel:
    """
    User preference vector learning.
    Categories: music, sports, tech, arts, food, gaming, film, fashion
    """

    CATEGORIES = ["music", "sports", "tech", "arts", "food", "gaming", "film", "fashion"]

    def __init__(self):
        # In-memory preference store: wallet -> np.array(8)
        self._prefs: dict[str, np.ndarray] = {}
        self.decay = 0.9  # EMA decay

    def update(self, wallet: str, category: str, rating: float):
        """Update preference vector for wallet given a rating on a category."""
        if wallet not in self._prefs:
            self._prefs[wallet] = np.ones(len(self.CATEGORIES)) / len(self.CATEGORIES)

        if category not in self.CATEGORIES:
            return

        idx = self.CATEGORIES.index(category)
        vec = self._prefs[wallet].copy()

        # Exponential moving average update
        signal = np.zeros(len(self.CATEGORIES))
        signal[idx] = (rating - 1) / 4.0  # normalize 1-5 to 0-1

        vec = self.decay * vec + (1 - self.decay) * signal
        # Normalize to sum to 1
        total = vec.sum()
        if total > 0:
            vec /= total
        self._prefs[wallet] = vec

    def get_preferences(self, wallet: str) -> dict:
        if wallet not in self._prefs:
            return {c: round(1 / len(self.CATEGORIES), 4) for c in self.CATEGORIES}
        vec = self._prefs[wallet]
        return {c: round(float(v), 4) for c, v in zip(self.CATEGORIES, vec)}

    def recommend(self, wallet: str, events: list[dict]) -> list[dict]:
        """Score events by user preference match."""
        prefs = self.get_preferences(wallet)
        scored = []
        for evt in events:
            cat = evt.get("category", "music")
            score = prefs.get(cat, 0.0)
            scored.append({**evt, "preference_score": score})
        scored.sort(key=lambda x: x["preference_score"], reverse=True)
        return scored


class OrganizerReputationEngine:
    """
    Computes organizer reputation from verified ratings.
    Detects manipulation patterns.
    """

    def __init__(self):
        # wallet -> list of (rating, weight, timestamp)
        self._ratings: dict[str, list] = {}

    def add_rating(self, organizer: str, rating: float, weight: float, timestamp: int):
        if organizer not in self._ratings:
            self._ratings[organizer] = []
        self._ratings[organizer].append((rating, weight, timestamp))

    def compute_score(self, organizer: str) -> dict:
        ratings = self._ratings.get(organizer, [])
        if not ratings:
            return {"score": 0, "count": 0, "manipulation_detected": False}

        # Weighted average
        total_w = sum(r[1] for r in ratings)
        weighted_sum = sum(r[0] * r[1] for r in ratings)
        avg = (weighted_sum / total_w) if total_w > 0 else 0

        # Manipulation detection: if >30% ratings arrived within 1 hour = suspicious
        n = len(ratings)
        if n >= 10:
            timestamps = sorted(r[2] for r in ratings)
            # Check for burst: 30% of ratings in 1 hour window
            window = 3600
            burst_count = 0
            for i in range(n):
                count_in_window = sum(1 for j in range(n) if 0 <= timestamps[j] - timestamps[i] <= window)
                burst_count = max(burst_count, count_in_window)
            manipulation = burst_count > (n * 0.3)
        else:
            manipulation = False

        return {
            "score": round((avg / 5.0) * 100, 1),
            "count": n,
            "manipulation_detected": manipulation,
        }


class LoyaltyEngine:
    """
    Computes loyalty tier and benefits for wallets.
    Tier thresholds match on-chain contract.
    """

    TIERS = {
        0: {"name": "Bronze",   "min": 0,   "max": 19,  "risk_reduction": 0,   "discount": 0},
        1: {"name": "Silver",   "min": 20,  "max": 49,  "risk_reduction": 10,  "discount": 5},
        2: {"name": "Gold",     "min": 50,  "max": 99,  "risk_reduction": 20,  "discount": 10},
        3: {"name": "Platinum", "min": 100, "max": 9999,"risk_reduction": 35,  "discount": 20},
    }

    def compute(self, loyalty_points: int) -> dict:
        for tier_id, tier in self.TIERS.items():
            if tier["min"] <= loyalty_points <= tier["max"]:
                return {
                    "tier_id": tier_id,
                    "tier_name": tier["name"],
                    "loyalty_points": loyalty_points,
                    "risk_reduction": tier["risk_reduction"],
                    "discount_percent": tier["discount"],
                    "next_tier_points": self.TIERS.get(tier_id + 1, {}).get("min"),
                }
        return self.compute(0)


class ModelManager:
    def __init__(self):
        self.risk_model    = RiskModel()
        self.pref_model    = PreferenceModel()
        self.rep_engine    = OrganizerReputationEngine()
        self.loyalty_engine = LoyaltyEngine()

    def initialize(self):
        MODEL_DIR.mkdir(exist_ok=True)
        if self.risk_model.model_path.exists():
            logger.info("Loading saved risk model...")
            self.risk_model.load()
        else:
            logger.info("No saved model found, training fresh...")
            self.risk_model.train()
