// project/src/modules/_util/Search/_helpers/productSearch.helpers.tsx
import {
  parseSearchTerm,
  runSearchMatch,
} from "./customerSearch.helpers";

/*
  ------------------------
  PRODUCT SCHEMAS
  ------------------------
*/

export function productNameSchema(product: any) {
  return {
    fields: {
      name: (product.name ?? "").toLowerCase(),
    },
    order: ["name"],
  };
}

export function productSerialSchema(product: any) {
  return {
    fields: {
      serial: (product.serial_number ?? "").toLowerCase(),
    },
    order: ["serial"],
  };
}

export function productMakeModelSchema(product: any) {
  return {
    fields: {
      make: (product.make ?? "").toLowerCase(),
      model: (product.model ?? "").toLowerCase(),
    },
    // same field priority for every token
    order: ["make", "model", "make", "model"],
  };
}

/*
  ------------------------
  DETERMINE PRODUCT CONTEXT
  ------------------------
*/

export function determineProductSearchContext(
  raw: string,
  products: any[]
) {
  const parsed = parseSearchTerm(raw);

  // SERIAL NUMBER (contains digits or mixed)
  const serialMatch = getBestMatch(parsed, products, productSerialSchema);
  if (serialMatch) {
    return {
      type: "serial" as const,
      schema: productSerialSchema,
      bestMatch: serialMatch,
      parsed,
    };
  }

  // NAME
  const nameMatch = getBestMatch(parsed, products, productNameSchema);
  if (nameMatch) {
    return {
      type: "name" as const,
      schema: productNameSchema,
      bestMatch: nameMatch,
      parsed,
    };
  }

  // MAKE / MODEL
  const mmMatch = getBestMatch(parsed, products, productMakeModelSchema);
  if (mmMatch) {
    return {
      type: "make_model" as const,
      schema: productMakeModelSchema,
      bestMatch: mmMatch,
      parsed,
    };
  }

  return {
    type: null,
    schema: productNameSchema,
    bestMatch: null,
    parsed,
  };
}

/*
  ------------------------
  GENERIC MATCH
  ------------------------
*/

function getBestMatch<T>(
  parsed: any,
  list: T[],
  schemaBuilder: (item: T) => any
): T | null {
  for (const item of list) {
    const schema = schemaBuilder(item);
    const result = runSearchMatch(parsed, schema);
    if (result.isMatch) return item;
  }
  return null;
}