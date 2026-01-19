// server/handlers/modules/estimations/runtime/types.ts
export type GraphNode = {
  id: number;
  node_id: string;
  node_type: "question" | "cost";
  label: string;
  config: any;
};

export type GraphEdge = {
  id?: number;
  from_node_idx: number;
  to_node_idx: number;
  edge_condition: any;
  execution_priority: number;
};

export type LoadedGraph = {
  graph_idx: number;
  nodesById: Map<number, GraphNode>;
  edgesFromNode: Map<number, GraphEdge[]>;
  incomingToNode: Map<number, GraphEdge[]>;
  entryNodes: GraphNode[];
};

export type FactMap = Record<string, any>;