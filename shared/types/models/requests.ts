// shared/types/models/requests.ts
export interface JwtPayload {
  id: string;
  email: string;
  admin?: number;
}