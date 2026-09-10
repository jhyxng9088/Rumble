# RUMBLE

Casual 3D arena-action PWA prototype.

## Stage 1 scope

- Babylon.js rooftop arena
- one toy-like player character
- fixed diagonal top-down camera with smooth follow
- screen-relative movement
- real pointer-owned mobile joystick
- keyboard fallback for desktop testing
- lightweight static collision and DPR cap for mobile performance

Combat, AI, online features, accounts, backend services, shops, skins, and ranking are intentionally out of scope for Stage 1.

## Run

```bash
npm install
npm run dev
```

## Verify

```bash
npm run check
npm run build
```

Architecture ownership rules live in `docs/ARCHITECTURE.md`.
