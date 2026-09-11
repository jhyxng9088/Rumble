# RUMBLE

Mobile-first 2.5D brawler prototype rebuilt from the original 3D Stage 1.

## Current prototype

- perspective arena rendered on Canvas 2D
- player vs lightweight rival AI
- free lane movement
- light and heavy attacks
- dodge invulnerability
- hit-stop, knockback, impact particles, camera shake and zoom punch
- mobile joystick + direct action-button ownership

## Development

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

Runtime ownership is split into `input`, `combat`, `character`, `camera`, `world`, `effects`, and `ui`. `core/Game.ts` only coordinates the frame loop and those owners.
