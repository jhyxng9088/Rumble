# Stage 1 acceptance

Stage 1 stays limited to the first playable movement slice.

## Included
- One small 3D rooftop arena
- One toy-like player character
- Fixed diagonal top-down camera
- Screen-relative movement
- Direct-owned virtual joystick input
- Static collision against arena walls and obstacles
- Mobile DPR cap and safe-area aware HUD

## Not included yet
Combat, opponent AI, attacks, dash, knockback, hit-stop, effects, scoring, audio polish, and multiplayer remain outside Stage 1.

## Architecture rule
`core/Game.ts` coordinates the frame. Input, character, camera, world, and UI each own one responsibility. Do not add patch files, fake DOM clicks, MutationObserver ownership, or duplicate input listeners.
