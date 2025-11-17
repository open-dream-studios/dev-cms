// shared/types/models/search.ts

export type SearchContext = {
  type: "name" | "email" | "phone" | null;
  schema: (customer: any) => any;
  bestMatch: any | null;
  parsed: {
    raw: string;
    parts: string[];
  };
} | null;