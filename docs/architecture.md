# RUMBLE ownership

The game is built around single ownership from the first commit.

- `core/Game.ts`: frame coordination only
- `input/`: raw pointer/keyboard input and normalized intent
- `character/`: player movement and character presentation
- `camera/`: follow camera and screen-to-world movement basis
- `world/`: arena geometry, lighting, and static collision
- `ui/`: DOM HUD construction only

Combat and effects owners are added only when their stage begins. They must not be pre-implemented through UI or character-side workarounds.
