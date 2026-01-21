// // src/pemdas/components/VariableBar.tsx
// import React from "react";
// import { useDraggable } from "@dnd-kit/core";
// import { GraphNodeIcon } from "./GraphNode";
// import { nodeColors } from "../_constants/pemdas.constants";

// export type VarNodeInput = {
//   label: string;
//   value: number;
// }

// const VARS: VarNodeInput[] = [
//   {
//     label: "X",
//     value: 10,
//   },
//   {
//     label: "Y",
//     value: 20,
//   },
//   {
//     label: "Sq Ft",
//     value: 30,
//   },
// ];

// export const VariableBar = () => {
//   return (
//     <div className="flex justify-center gap-4 py-4">
//       {VARS.map((v) => (
//         <VariableItem key={v.label} varNode={v} />
//       ))}
//     </div>
//   );
// };

// const VariableItem = ({ varNode }: { varNode: VarNodeInput }) => {
//   const { attributes, listeners, setNodeRef } = useDraggable({
//     id: `var-${varNode.label}`,
//     data: { variable: varNode.label, value: varNode.value },
//   });

//   return (
//     <div
//       data-draggable
//       ref={setNodeRef}
//       {...attributes}
//       {...listeners}
//       style={{ backgroundColor: nodeColors["var"] }}
//       className="dim hover:brightness-75 w-10 h-10 rounded-full text-white flex items-center justify-center cursor-grab select-none"
//     >
//       <GraphNodeIcon />
//     </div>
//   );
// };
