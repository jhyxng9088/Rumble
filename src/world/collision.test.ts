import { describe, expect, it } from "vitest";
import { circleIntersectsAabb, moveCircleWithColliders } from "./collision";

const bounds = { minX: -5, maxX: 5, minZ: -4, maxZ: 4 };
const obstacle = { minX: 1, maxX: 2, minZ: -1, maxZ: 1 };

describe("world collision", () => {
  it("keeps the character inside arena bounds", () => {
    const result = moveCircleWithColliders(
      { x: 4.2, z: 0 },
      { x: 2, z: 0 },
      0.5,
      bounds,
      [],
    );
    expect(result.x).toBe(4.5);
  });

  it("blocks movement into an obstacle without blocking the free axis", () => {
    const result = moveCircleWithColliders(
      { x: 0.4, z: -1.7 },
      { x: 0.5, z: 0.6 },
      0.5,
      bounds,
      [obstacle],
    );
    expect(result.x).toBe(0.9);
    expect(result.z).toBe(-1.7);
  });

  it("detects circle-to-box overlap", () => {
    expect(circleIntersectsAabb({ x: 0.7, z: 0 }, 0.5, obstacle)).toBe(true);
    expect(circleIntersectsAabb({ x: 0.4, z: 0 }, 0.5, obstacle)).toBe(false);
  });
});
