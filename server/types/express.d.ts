import "express";
import "http";

declare module "http" {
  interface IncomingMessage {
    rawBody?: string | Buffer;
  }
}

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
      rawBody?: string | Buffer;
    }
  }
}

export {};