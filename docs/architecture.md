# Architecture

RUMBLE uses one canonical owner per gameplay responsibility.

- `input/InputController.ts`: keyboard, joystick, and action button input only
- `character/Fighter.ts`: fighter state, movement, dodge, damage state
- `combat/CombatSystem.ts`: attack data, hit validation, hit-stop handoff
- `camera/ArenaCamera.ts`: impact shake and zoom punch
- `world/ArenaWorld.ts`: canvas sizing, arena bounds, perspective projection and arena drawing
- `effects/Effects.ts`: pooled short-lived impact visuals
- `ui/GameUI.ts`: DOM HUD and control construction/update
- `core/Game.ts`: frame coordination and prototype rival decision loop

Forbidden patterns are enforced by `scripts/architecture-check.mjs`: patch-style runtime files, MutationObserver ownership, synthetic DOM clicks, and Babylon legacy imports.
