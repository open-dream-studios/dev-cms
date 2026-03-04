// project/src/modules/EstimationFormsModule/components/EstimationFormStructureTree.tsx
"use client";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  EstimationBuilderFormGraph,
  EstimationBuilderNode,
} from "../_helpers/estimationForms.helpers";
import { clickClass } from "./EstimationFormsBuilder";

const EstimationFormStructureTree = ({
  root,
  collapsed,
  selectedNodeId,
  onToggle,
  onSelect,
}: {
  root: EstimationBuilderFormGraph;
  collapsed: string[];
  selectedNodeId: string | null;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}) => {
  const TreeRow = ({
    node,
    depth,
  }: {
    node: EstimationBuilderNode;
    depth: number;
  }) => {
    const isCollapsed = collapsed.includes(node.id);
    const hasChildren = node.kind === "form" || node.kind === "choice";
    const selected = selectedNodeId === node.id;

    return (
      <>
        <div
          className={`h-8 rounded-lg px-2 flex items-center gap-1 ${clickClass}`}
          style={{
            marginLeft: depth * 12,
            backgroundColor: selected ? "rgba(14,165,233,0.15)" : "transparent",
          }}
          onClick={() => onSelect(node.id)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) onToggle(node.id);
            }}
            className="h-6 w-6 rounded-md flex items-center justify-center"
          >
            {hasChildren ? (
              isCollapsed ? (
                <ChevronRight size={12} />
              ) : (
                <ChevronDown size={12} />
              )
            ) : (
              <span className="w-[12px]" />
            )}
          </button>
          <p className="text-[11px] font-[600] truncate">{node.name}</p>
        </div>

        {!isCollapsed &&
          node.kind === "form" &&
          node.children.map((child) => (
            <TreeRow
              key={child.id}
              node={child as EstimationBuilderNode}
              depth={depth + 1}
            />
          ))}

        {!isCollapsed &&
          node.kind === "choice" &&
          node.cases.map((child) => (
            <TreeRow
              key={child.id}
              node={child as EstimationBuilderNode}
              depth={depth + 1}
            />
          ))}
      </>
    );
  };

  return <TreeRow node={root} depth={0} />;
};

export default EstimationFormStructureTree;

// EXAMPLE USAGE:
{/* <div className="w-[250px] rounded-2xl border border-black/8 bg-white/80 backdrop-blur-sm p-2.5 overflow-y-auto">
  <p className="text-[11px] font-[700] uppercase tracking-wide opacity-60 px-1 pb-2">
    Structure
  </p>
  <EstimationFormStructureTree
    root={selectedForm.root}
    collapsed={collapsedNodeIds}
    selectedNodeId={selectedNodeId}
    onToggle={toggleCollapsedNode}
    onSelect={(nodeId) => {
      setSelectedNodeId(nodeId);
      const node = findNodeById(selectedForm.root, nodeId);
      if (node?.kind === "form") {
        setActivePath((prev) => {
          const exists = prev.indexOf(node.id);
          if (exists >= 0) return prev.slice(0, exists + 1);
          return [...prev, node.id];
        });
      }
    }}
  />
</div>; */}
