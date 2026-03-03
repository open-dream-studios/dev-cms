// shared/types/models/utils/search.ts

export type ValidSearchModule =
  | "customers-module"
  | "customer-products-module";

/*
  ------------------------
  CUSTOMER SEARCH CONTEXT
  ------------------------
*/
export type CustomerSearchContext = {
  type: "name" | "email" | "phone" | null;
  schema: (customer: any) => any;
  bestMatch: any | null;
  parsed: {
    raw: string;
    parts: string[];
  };
} | null;

/*
  ------------------------
  PRODUCT SEARCH CONTEXT
  ------------------------
*/
export type ProductSearchContext = {
  type: "name" | "serial" | "make_model" | null;
  schema: (product: any) => any;
  bestMatch: any | null;
  parsed: {
    raw: string;
    parts: string[];
  };
} | null;