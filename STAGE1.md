# Stage 1 acceptance

Stage 1 is intentionally limited to the first playable movement slice.

## Included

- One small 3D rooftop arena
- One simple toy-like player character
- Fixed-angle diagonal top-down camera
- Screen-relative movement
- Direct-owned virtual joystick input
- Basic collision against arena walls and obstacles
- Mobile DPR cap and safe-area aware HUD

## Not included yet

Combat, opponent AI, attack buttons, knockback, hit-stop, effects, scoring, audio polish, and multiplayer remain out of Stage 1.

## Architecture rule

`core/Game.ts` coordinates the frame. Input, character, camera, world, and UI each own their own responsibility. Do not add patch files, synthetic DOM clicks, MutationObserver-based ownership, or duplicate input listeners.
