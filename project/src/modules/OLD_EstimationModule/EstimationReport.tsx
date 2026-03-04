// estimationTree.ts
"use client";
import { useContext, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { getCardStyle, getInnerCardStyle } from "@/styles/themeStyles";
import { AuthContext } from "@/contexts/authContext";
import { useEstimationsUIStore } from "./_store/estimations.store";

function money(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

// export const estimationTree = {
//   root: {
//     node_id: "root",
//     label: "Bathroom Remodel",
//     breakdown: {
//       labor: 1420,
//       materials: 2185,
//       misc: 395,
//       total: 4000,
//     },
//     children: [
//       {
//         node_id: "shower",
//         label: "Shower",
//         breakdown: { labor: 520, materials: 980, misc: 120, total: 1620 },
//         children: [
//           {
//             node_id: "shower_pan",
//             label: "Shower Pan",
//             breakdown: { labor: 120, materials: 350, misc: 30, total: 500 },
//             children: [],
//           },
//           {
//             node_id: "tile",
//             label: "Wall Tile",
//             breakdown: { labor: 260, materials: 420, misc: 40, total: 720 },
//             children: [],
//           },
//           {
//             node_id: "fixtures",
//             label: "Fixtures",
//             breakdown: { labor: 140, materials: 210, misc: 50, total: 400 },
//             children: [],
//           },
//         ],
//       },
//       {
//         node_id: "sink",
//         label: "Vanity & Sink",
//         breakdown: { labor: 360, materials: 620, misc: 80, total: 1060 },
//         children: [
//           {
//             node_id: "cabinet",
//             label: "Cabinet",
//             breakdown: { labor: 140, materials: 320, misc: 20, total: 480 },
//             children: [],
//           },
//           {
//             node_id: "countertop",
//             label: "Countertop",
//             breakdown: { labor: 90, materials: 190, misc: 30, total: 310 },
//             children: [],
//           },
//           {
//             node_id: "mirror_lighting",
//             label: "Mirror & Lighting",
//             breakdown: { labor: 130, materials: 110, misc: 30, total: 270 },
//             children: [],
//           },
//         ],
//       },
//       {
//         node_id: "toilet",
//         label: "Toilet",
//         breakdown: { labor: 180, materials: 210, misc: 35, total: 425 },
//         children: [],
//       },
//       {
//         node_id: "flooring",
//         label: "Flooring",
//         breakdown: { labor: 360, materials: 375, misc: 40, total: 775 },
//         children: [],
//       },
//       {
//         node_id: "permits",
//         label: "Permits & Cleanup",
//         breakdown: { labor: 0, materials: 0, misc: 120, total: 120 },
//         children: [],
//       },
//     ],
//   },
// };

export default function EstimationReport() {
  const { currentUser } = useContext(AuthContext);
  const { latestReport } = useEstimationsUIStore();

  const theme = useCurrentTheme();
  const { setShowEstimationReport } = useEstimationsUIStore();

  if (!currentUser || !latestReport) return null;

  const root = latestReport.root;
  const pricingData = root.breakdown.total;

  const VARIANCE = 0.15;
  const withVariance = (v: number) => ({
    min: Math.round(v * (1 - VARIANCE)),
    max: Math.round(v * (1 + VARIANCE)),
  });

  const chartData = [
    { name: "Labor", ...withVariance(root.breakdown.labor) },
    { name: "Materials", ...withVariance(root.breakdown.materials) },
    { name: "Misc", ...withVariance(root.breakdown.misc) },
  ];
  const maxY = Math.max(...chartData.map((d: any) => d.max));

  const onBack = () => {
    setShowEstimationReport(false);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-6 overflow-y-auto">
      {/* HEADER */}
      {/* <div
        className="rounded-2xl p-5"
        style={{
          backgroundColor: currentTheme.background_2_dim,
        }}
      >
        <div className="text-sm opacity-60">Estimated Project Total</div>
        <div className="text-3xl font-semibold">
          {money(root.breakdown.total)}
        </div>
      </div> */}

      {/* GRAPH */}
      {/* <div
        className="rounded-2xl p-5"
        style={{
          backgroundColor: currentTheme.background_2_dim,
        }}
      >
        <div className="text-sm opacity-60 mb-2">Cost distribution</div>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `$${v / 1000}k`} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div> */}

      {/* HEADER */}
      <div
        className="rounded-2xl px-5 py-[14px]"
        style={getCardStyle(currentUser.theme, theme)}
      >
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[13px] opacity-60">Estimated Project Cost</div>
            <div className="text-[28px] font-semibold">
              {money(pricingData - 100)} – {money(pricingData + 1)}
            </div>
            <div className="text-[14px] opacity-70 capitalize">Tier: {"1"}</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="mt-[-30px] px-5 py-2 rounded-[10px] cursor-pointer hover:brightness-75 dim"
              style={getInnerCardStyle(currentUser.theme, theme)}
            >
              Back
            </button>
            {/* <button
              onClick={onBack}
              className="px-5 py-2 rounded-[10px] cursor-pointer hover:brightness-75 dim"
              style={{ background: theme.app_color_1, color: theme.text_1 }}
            >
              Done
            </button> */}
          </div>
        </div>
      </div>

      {/* CHART */}
      <div
        className="rounded-2xl px-5 py-4 w-full md:max-w-[50%]"
        style={getCardStyle(currentUser.theme, theme)}
      >
        <div className="mb-3">
          <div className="text-[13px] opacity-60">Cost distribution</div>
          <div className="text-[18px] font-semibold">Breakdown by category</div>
        </div>

        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <div className="w-[100%] h-[100%] relative">
              <div className="w-[100%] h-[100%] absolute left-0 top-0">
                <BarChart
                  data={chartData}
                  tabIndex={-1}
                  style={{ outline: "none" }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, opacity: 0.75 }}
                  />
                  <YAxis
                    tickFormatter={(v) => `$${v / 1000}k`}
                    tick={{
                      opacity: 0.75,
                    }}
                    domain={[0, maxY]}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    formatter={(_: any, __: any, ctx: any) =>
                      `${money(ctx.payload.min)} – ${money(ctx.payload.max)}`
                    }
                  />

                  {/* BACK BAR — MAX */}
                  <Bar
                    dataKey="max"
                    fill="#7c3aed"
                    radius={[10, 10, 0, 0]}
                    opacity={0.45}
                  />
                </BarChart>
              </div>

              <div className="w-[100%] h-[100%] absolute left-0 top-0">
                <BarChart
                  data={chartData}
                  tabIndex={-1}
                  style={{ outline: "none" }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 12, opacity: 0 }} />
                  <YAxis
                    tickFormatter={(v) => `$${v / 1000}k`}
                    tick={{ opacity: 0 }}
                    domain={[0, maxY]}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    formatter={(_: any, __: any, ctx: any) =>
                      `${money(ctx.payload.min)} – ${money(ctx.payload.max)}`
                    }
                  />

                  {/* FRONT BAR — MIN */}
                  <Bar
                    dataKey="min"
                    fill="#06b6d4"
                    radius={[10, 10, 0, 0]}
                    className="brightness-97"
                  />
                </BarChart>
              </div>
            </div>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TREE */}
      <EstimationTree tree={root} />
    </div>
  );
}

type TreeNode = {
  node_id: string;
  label: string;
  breakdown: {
    labor: number;
    materials: number;
    misc: number;
    total: number;
  };
  children: TreeNode[];
};

export function EstimationTree({ tree }: { tree: TreeNode }) {
  const currentTheme = useCurrentTheme();
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: currentTheme.background_2_dim,
      }}
    >
      <TreeRow node={tree} depth={0} isLast />
    </div>
  );
}

function TreeRow({
  node,
  depth,
  isLast,
}: {
  node: TreeNode;
  depth: number;
  isLast: boolean;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      {/* ROW */}
      <div
        className="relative flex items-center gap-3 h-[42px] px-4 text-sm hover:bg-white/5"
        style={{ paddingLeft: depth * 22 + 12 }}
      >
        {/* TREE LINE */}
        {depth > 0 && (
          <div className="absolute left-[calc(12px+((depth-1)*22))] top-0 bottom-0 w-px bg-white/10" />
        )}

        {/* TOGGLE */}
        <div
          onClick={() => hasChildren && setOpen(!open)}
          className="w-4 flex items-center justify-center cursor-pointer opacity-70"
        >
          {hasChildren ? (
            open ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )
          ) : (
            <div className="w-[6px] h-[6px] rounded-full bg-white/30" />
          )}
        </div>

        {/* LABEL */}
        <div className="flex-1 truncate font-medium">{node.label}</div>

        {/* TOTAL */}
        <div className="w-[90px] text-right font-semibold">
          {money(node.breakdown.total)}
        </div>

        {/* PILLS */}
        <div className="flex gap-[6px] ml-[8px]">
          <Pill
            label="Labor"
            value={node.breakdown.labor}
            color="bg-cyan-500/20"
          />
          <Pill
            label="Materials"
            value={node.breakdown.materials}
            color="bg-violet-500/20"
          />
          <Pill
            label="Misc"
            value={node.breakdown.misc}
            color="bg-zinc-500/30"
          />
        </div>
      </div>

      {/* CHILDREN */}
      {open &&
        node.children.map((child, i) => (
          <TreeRow
            key={child.node_id}
            node={child}
            depth={depth + 1}
            isLast={i === node.children.length - 1}
          />
        ))}
    </div>
  );
}

function Pill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className={`px-2 py-[2px] rounded-full text-[11px] opacity-80 ${color}`}
    >
      {label}: {money(value)}
    </div>
  );
}
