# Architecture

Canonical owners:
- `input/InputController.ts`: joystick, keyboard and action-button input
- `character/StylizedFighter.ts`: fighter state, movement and pose animation
- `combat/CombatSystem.ts`: attack windows, hit validation, damage, hit-stop
- `camera/FollowCamera.ts`: world-relative movement basis, follow framing, impact shake/FOV punch
- `world/ArenaWorld.ts`: arena geometry, lighting, bounds
- `effects/ImpactEffects.ts`: short-lived 3D hit/evade visuals
- `ui/GameUI.ts`: HUD and direct mobile controls
- `core/Game.ts`: frame coordination and rival decision loop only

No synthetic clicks, MutationObserver runtime ownership, patch files, or duplicate input owners.
