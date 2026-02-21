// shared/types/models/users.ts
export type ThemeType = "light" | "dark";
export interface User {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_img_src: string | null;
  theme: ThemeType;
  auth_provider: string;
  admin?: number;
  type: "internal" | "external";
  credits: string;
  created_at: string;
}