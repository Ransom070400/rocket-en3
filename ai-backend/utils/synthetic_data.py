"""
Synthetic data generator for training AI models.
Generates realistic scalper vs legitimate buyer patterns.
"""
import numpy as np


def generate_risk_data(n_samples: int = 10000, seed: int = 42):
    """
    Generate synthetic anti-scalping training data.

    Feature definitions:
    - wallet_age_days: 0-3650 (scalpers often use new wallets)
    - purchase_velocity: tickets per 24h (scalpers buy many fast)
    - resale_time_hours: avg time to resale (scalpers resell fast)
    - transfer_count: total transfers (scalpers = high)
    - gas_multiplier: gas paid vs base (bots pay high gas)
    - cluster_score: similarity to known bot wallets (0-1)
    - loyalty_points: on-chain loyalty (scalpers have low loyalty)
    """
    rng = np.random.default_rng(seed)

    n_legit   = int(n_samples * 0.75)
    n_scalper = n_samples - n_legit

    # Legitimate buyers
    legit = np.column_stack([
        rng.integers(180, 3650, n_legit),       # wallet_age_days: older wallets
        rng.integers(1, 3, n_legit),             # purchase_velocity: slow
        rng.uniform(24, 720, n_legit),           # resale_time_hours: slow resale or 0
        rng.integers(0, 5, n_legit),             # transfer_count: low
        rng.uniform(1.0, 1.5, n_legit),          # gas_multiplier: near base
        rng.uniform(0.0, 0.2, n_legit),          # cluster_score: low bot similarity
        rng.integers(0, 200, n_legit),           # loyalty_points: varied
    ])

    # Scalpers / bots
    scalper = np.column_stack([
        rng.integers(0, 90, n_scalper),          # wallet_age_days: new wallets
        rng.integers(3, 20, n_scalper),          # purchase_velocity: fast bulk
        rng.uniform(0, 48, n_scalper),           # resale_time_hours: immediate resale
        rng.integers(5, 50, n_scalper),          # transfer_count: high
        rng.uniform(1.5, 4.0, n_scalper),        # gas_multiplier: high gas (MEV bots)
        rng.uniform(0.6, 1.0, n_scalper),        # cluster_score: high bot similarity
        rng.integers(0, 10, n_scalper),          # loyalty_points: very low
    ])

    X = np.vstack([legit, scalper]).astype(float)
    y = np.array([0] * n_legit + [1] * n_scalper)

    # Add noise
    X += rng.normal(0, 0.05, X.shape) * X

    # Shuffle
    idx = rng.permutation(len(X))
    return X[idx], y[idx]


def generate_rating_data(n_organizers: int = 200, seed: int = 42):
    """
    Generate synthetic organizer rating data.
    Returns: list of (organizer_id, rating, weight, timestamp)
    """
    rng = np.random.default_rng(seed)
    data = []

    for org_id in range(n_organizers):
        n_ratings = int(rng.integers(5, 50))
        base_quality = rng.uniform(2.5, 5.0)  # Organizer's "true" quality
        is_manipulated = rng.random() < 0.1   # 10% are manipulators

        base_time = 1700000000
        for i in range(n_ratings):
            if is_manipulated and i > n_ratings // 2:
                # Burst of fake 5-star ratings
                rating = 5.0
                timestamp = base_time + rng.integers(0, 3600)
            else:
                rating = float(np.clip(rng.normal(base_quality, 0.5), 1, 5))
                timestamp = base_time + i * rng.integers(3600, 86400)

            weight = float(rng.integers(1, 5))
            data.append((org_id, round(rating), weight, timestamp))

    return data
