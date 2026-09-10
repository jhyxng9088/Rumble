# RUMBLE

Stage 1 mobile-first 3D arena prototype.

## Scope

Stage 1 only: one arena, one player character, fixed-angle follow camera, and direct virtual-joystick movement.

## Development

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

The project is intentionally split by ownership: `input`, `character`, `camera`, `world`, `ui`, with `core/Game.ts` as the only frame coordinator.
