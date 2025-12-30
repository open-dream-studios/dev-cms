// shared/types/models/requests.ts
export interface JwtPayload {
  user_id: string;
  email: string;
  admin?: number;
}