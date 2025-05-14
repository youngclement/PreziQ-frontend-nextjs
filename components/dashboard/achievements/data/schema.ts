export interface Achievement {
  achievementId: string;
  name: string;
  description?: string;
  iconUrl?: string;
  requiredPoints: number;
  createdAt?: string;
  updatedAt?: string;
}
