// project/src/modules/EstimationModule/EstimationPEMDAS/types.ts
export type FactNode = {
  id: string;
  key: string;
  value?: number;
};

export type Operator = "+" | "-" | "*" | "/";

export type PemdasNode =
  | {
      id: string;
      type: "fact";
      factId: string;
      x: number;
      y: number;
    }
  | {
      id: string;
      type: "operator";
      operator: Operator;
      x: number;
      y: number;
    }
  | {
      id: string;
      type: "group";
      x: number;
      y: number;
    };

export type Edge = {
  from: string;
  to: string;
};