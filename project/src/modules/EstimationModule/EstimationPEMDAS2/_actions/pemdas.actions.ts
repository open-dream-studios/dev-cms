// src/pemdas/_actions/pemdas.actions.ts
import { PemdasNode } from "../types";
import { ContextMenuDefinition } from "@open-dream/shared";

export const createPemdasNodeContextMenu = (
  dispatch: React.Dispatch<any>
): ContextMenuDefinition<PemdasNode> => ({
  items: [
    {
      id: "delete-node",
      label: "Delete Node",
      danger: true,
      onClick: async (node) => {
        handleDeletePemdasNode(dispatch, node);
      },
    },
  ],
});

export const handleDeletePemdasNode = (
  dispatch: React.Dispatch<any>,
  node: PemdasNode
) => {
  dispatch({
    type: "DELETE_NODE",
    nodeId: node.id,
  });
};
