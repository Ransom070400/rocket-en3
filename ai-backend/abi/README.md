# ABI Directory

After running `forge build` in the contracts directory, copy the ABI here:

```bash
# From contracts/
forge build
cp out/RocketEN3.sol/RocketEN3.json ../ai-backend/abi/RocketEN3.json
```

The blockchain listener will use `RocketEN3.json` to subscribe to events.
