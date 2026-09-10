export interface PlanarPoint {
  x: number;
  z: number;
}

export interface ArenaBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface AxisAlignedObstacle extends ArenaBounds {}

export function moveCircleWithColliders(
  current: PlanarPoint,
  delta: PlanarPoint,
  radius: number,
  bounds: ArenaBounds,
  obstacles: readonly AxisAlignedObstacle[],
): PlanarPoint {
  const next = { ...current };

  const nextX = clamp(current.x + delta.x, bounds.minX + radius, bounds.maxX - radius);
  if (!intersectsAny({ x: nextX, z: current.z }, radius, obstacles)) {
    next.x = nextX;
  }

  const nextZ = clamp(current.z + delta.z, bounds.minZ + radius, bounds.maxZ - radius);
  if (!intersectsAny({ x: next.x, z: nextZ }, radius, obstacles)) {
    next.z = nextZ;
  }

  return next;
}

function intersectsAny(
  point: PlanarPoint,
  radius: number,
  obstacles: readonly AxisAlignedObstacle[],
): boolean {
  return obstacles.some((obstacle) => circleIntersectsAabb(point, radius, obstacle));
}

export function circleIntersectsAabb(
  point: PlanarPoint,
  radius: number,
  obstacle: AxisAlignedObstacle,
): boolean {
  const closestX = clamp(point.x, obstacle.minX, obstacle.maxX);
  const closestZ = clamp(point.z, obstacle.minZ, obstacle.maxZ);
  const dx = point.x - closestX;
  const dz = point.z - closestZ;
  return dx * dx + dz * dz < radius * radius;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
