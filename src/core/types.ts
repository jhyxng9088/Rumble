export interface Vec2 {
  x: number;
  y: number;
}

export type FighterId = 'player' | 'rival';
export type AttackKind = 'light' | 'heavy';

export interface InputFrame {
  move: Vec2;
  lightPressed: boolean;
  heavyPressed: boolean;
  dodgePressed: boolean;
}

export interface ArenaBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}
