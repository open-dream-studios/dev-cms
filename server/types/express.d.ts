// server/types/express.d.ts
import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id?: number;
        email?: string;
        admin?: boolean;
        clearance?: number;
        project_idx?: number;
        [key: string]: any;
      };
      accessToken?: string | undefined;
    }
  }
}

export {};
