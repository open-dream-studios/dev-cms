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
  credits: string;
  auth_provider: string;
  created_at: string;
  admin?: number;
  type: "internal" | "external";
}