# RUMBLE architecture rules

RUMBLE starts with the ownership rules that are usually postponed until a cleanup pass.

- One responsibility has one canonical owner.
- Input state belongs to `InputController`; UI controls only translate pointer input into values.
- `PlayerCharacter` owns character movement/visual locomotion, not DOM input.
- `FollowCamera` owns screen-to-world direction mapping and camera follow behavior.
- `RooftopWorld` owns arena geometry and world collision boundaries.
- `Game` is composition/lifecycle only. It must not become a second owner for feature logic.
- No fake click targets, DOM hit-area workarounds, MutationObserver patches, `*-patch` files, duplicate listeners, duplicate timers, or shadow feature owners.
- New systems are added only when their Stage needs them. Empty placeholder managers are not created in advance.
- Prefer small explicit interfaces between systems over shared global mutable state.
- Every owner that registers listeners must also dispose them.

Stage 1 intentionally contains no Combat or Effects owner yet. They arrive in Stage 2 when real behavior exists.
