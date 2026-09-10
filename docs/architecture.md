# RUMBLE canonical ownership

RUMBLE starts with single ownership so later stages do not need a cleanup/unification pass.

- `core/Game.ts`: frame coordination only
- `input/`: raw pointer/keyboard input and normalized intent
- `character/`: player movement and character presentation
- `camera/`: follow camera and screen-to-world movement basis
- `world/`: arena geometry, lighting, and static collision
- `ui/`: DOM HUD construction only

`combat/` and `effects/` are added only when their stages begin. They must not be pre-implemented through UI, DOM, or character-side workarounds.

Forbidden patterns: patch-layer files, fake/synthetic DOM clicks, MutationObserver ownership, duplicate listeners for the same input responsibility, and parallel owners for one game state.
