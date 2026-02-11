// src/modules/EstimationModule/components/VariableDisplay.tsx
import { FactType, VariableScope } from "@open-dream/shared";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import { factTypeConversion } from "../_helpers/estimations.helpers";
import { GraphNodeIcon } from "../EstimationPEMDAS/components/GraphNode";
import { nodeColors } from "../EstimationPEMDAS/_constants/pemdas.constants";
import { useEstimationsUIStore } from "../_store/estimations.store";
import { cleanVariableKey } from "@/util/functions/Variables";
import { motion } from "framer-motion";
import { cubicBezier } from "framer-motion";

const VariableDisplay = ({
  fact_key,
  fact_type,
  variable_scope,
  displayOnly,
}: {
  fact_key: string;
  fact_type: FactType;
  variable_scope: VariableScope;
  displayOnly: boolean;
}) => {
  const currentTheme = useCurrentTheme();
  const { selectingVariableReturn } = useEstimationsUIStore();

  const dashedBorderWave = {
    animate: {
      borderColor: [
        "rgba(255,255,255,0.35)",
        "rgba(255,255,255,0.6)",
        "rgba(255,255,255,0.6)",
        "rgba(255,255,255,0.35)",
      ],
      borderDashoffset: [0, 14],
    },
    transition: {
      duration: 0.9,
      times: [0, 0.4, 0.7, 1],
      ease: [
        cubicBezier(0.37, 0.0, 0.63, 1.0),
        cubicBezier(0.37, 0.0, 0.63, 1.0),
        cubicBezier(0.37, 0.0, 0.63, 1.0),
      ],
      repeat: Infinity,
    },
  };

  const selectingVariable =
    selectingVariableReturn !== null &&
    selectingVariableReturn.type === "variable";
    
  return (
    <motion.div
      style={{
        backgroundColor: currentTheme.background_2_dim,
        border: "1px dashed",
        borderColor:
          !displayOnly && selectingVariable
            ? currentTheme.text_4
            : "transparent",
      }}
      {...(!displayOnly && selectingVariable ? dashedBorderWave : {})}
      className="w-[100%] max-w-[220px] select-none mt-[4px] flex flex-row gap-[8.5px] items-center px-2 py-1 rounded-[4px]"
    >
      <div
        className="brightness-90 w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: nodeColors[variable_scope] }}
      >
        <GraphNodeIcon color={null} />
      </div>
      <div className="min-w-0">
        <div className="text-sm truncate">{cleanVariableKey(fact_key)}</div>
        <div className="text-xs opacity-60">
          {capitalizeFirstLetter(factTypeConversion(fact_type))}
        </div>
      </div>
    </motion.div>
  );
};

export default VariableDisplay;
