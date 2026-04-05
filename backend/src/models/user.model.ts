export type StatFocus = "strength" | "agility" | "intelligence";

export interface User {
  id: string;
  username: string;
  trustScore: number;
  streak: number;
  xp: number;
  strength: number;
  agility: number;
  intelligence: number;
  createdAt: string;
}
