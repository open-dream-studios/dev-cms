// project/src/modules/EstimationsModule/_helpers/estimations.helpers.ts
import { FactType } from "@open-dream/shared";

export const factTypeConversion = (factType: FactType) => {
  let fact: any = factType;
  if (factType === "enum") fact = "Selection";
  if (factType === "boolean") fact = "True / False";
  if (factType === "string") fact = "Text";
  return fact;
};

