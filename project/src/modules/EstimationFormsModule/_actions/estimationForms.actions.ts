// project/src/modules/EstimationFormsModule/_actions/estimationForms.actions.ts
import { NodePaletteKind } from "../_store/estimationForms.store";
import { Braces, CircleDollarSign, GitBranchPlus } from "lucide-react";
import { LucideIcon } from "lucide-react";

export const estimationNodePalette: {
  kind: NodePaletteKind;
  label: string;
  description: string;
  Icon: LucideIcon;
  accent: string;
}[] = [
  {
    kind: "form",
    label: "FORM",
    description: "Container of additive child nodes",
    Icon: Braces,
    accent: "#3B82F6",
  },
  {
    kind: "choice",
    label: "CHOICE",
    description: "Routes into one selected case form",
    Icon: GitBranchPlus,
    accent: "#14B8A6",
  },
  {
    kind: "const",
    label: "CONST",
    description: "Fixed numeric value for estimation",
    Icon: CircleDollarSign,
    accent: "#F59E0B",
  },
];
