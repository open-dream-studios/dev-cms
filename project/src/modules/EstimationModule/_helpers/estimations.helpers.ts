import { FactType } from "@open-dream/shared";

// project/src/modules/EstimationsModule/_helpers/estimations.helpers.ts
export const factTypeConversion = (factType: FactType) => {
  let fact: any = factType;
  if (factType === "enum") fact = "Selectable";
  if (factType === "boolean") fact = "Yes / No";
  if (factType === "string") fact = "Text";
  return fact;
};
