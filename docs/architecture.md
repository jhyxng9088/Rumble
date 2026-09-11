# Architecture

Canonical owners:
- `input/InputController.ts`: joystick, keyboard and action-button input
- `character/AnimalFighter.ts`: animal movement, damage state and presentation
- `throwing/ThrowableSystem.ts`: throwable spawning, ground/held/flying/respawn state, pickup, throw, collisions, explosions and hit-stop
- `camera/FollowCamera.ts`: follow framing, screen-to-world movement basis and impact impulse
- `world/ArenaWorld.ts`: arena geometry, lighting and bounds
- `effects/ImpactEffects.ts`: short-lived impact and explosion visuals
- `ui/GameUI.ts`: HUD and direct mobile controls
- `core/Game.ts`: frame coordination and rival AI only

No parallel combat owner, synthetic clicks, MutationObserver runtime ownership or patch files.
