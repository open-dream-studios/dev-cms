// src/pemdas/_actions/pemdas.actions.tsx 
import { PemdasNode } from "../types";
import { ContextMenuDefinition } from "@open-dream/shared";

export const createPemdasNodeContextMenu = (
  onEdit: (node: PemdasNode) => void,
  dispatch: React.Dispatch<any>,
): ContextMenuDefinition<PemdasNode> => ({
  items: [
    {
      id: "edit-node",
      label: "Edit Node",
      onClick: (node) => onEdit(node),
    },
    {
      id: "delete-node",
      label: "Delete Node",
      danger: true,
      onClick: (node) => {
        dispatch({
          type: "DELETE_NODE",
          nodeId: node.id,
        });
      },
    },
  ],
});

export const handleDeletePemdasNode = (
  dispatch: React.Dispatch<any>,
  node: PemdasNode,
) => {
  dispatch({
    type: "DELETE_NODE",
    nodeId: node.id,
  });
};
