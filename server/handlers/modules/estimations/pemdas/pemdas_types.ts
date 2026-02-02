// server/handlers/modules/estimations/pemdas/pemdas_types.ts
export type PemdasOperand = "+" | "-" | "*" | "/";

export type PemdasNodeKind = "variable" | "constant" | "contributor-node" | "contributor-bucket";

export type PemdasNodeConfig = {
  kind: PemdasNodeKind;
  operand: PemdasOperand; // applied BEFORE this node
  value?: number;         // constant
  var_key?: string;       // variable
  target_line_id?: string; // layer -> jumps to another line
};

export type PemdasLineConfig = {
  line_id: string;
  nodes: PemdasNodeConfig[];
};

export type PemdasGraphConfig = {
  lines: PemdasLineConfig[];
};