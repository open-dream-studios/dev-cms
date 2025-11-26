// project/src/modules/Dashboard/components/components.tss
import React from "react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { motion } from "framer-motion";
import { formatCurrency, formatInt } from "./data";

export const MetricCard: React.FC<{
  title: string;
  value: React.ReactNode;
  delta?: number;
  icon?: React.ReactNode;
  loading?: boolean;
  theme: any;
}> = ({ title, value, delta = 0, icon, loading = false, theme }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className={
        "cursor-pointer dim border border-white/6 rounded-2xl p-4 shadow-2xl backdrop-blur-sm"
      }
      style={{
        background: theme.cardBackground,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="w-[100%] flex items-center gap-3">
          <div
            className="p-3 rounded-xl"
            style={{
              backgroundColor: theme.background_3,
            }}
          >
            {icon}
          </div>
          <div className="w-[100%] h-[100%]">
            <div className="flex flex-row justify-between w-[100%]">
              <div className="text-sm" style={{ color: theme.text_2 }}>
                {title}
              </div>
              <div
                className={`text-sm ${
                  delta >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {delta >= 0 ? `▲ ${delta}%` : `▼ ${Math.abs(delta)}%`}
              </div>
            </div>
            <div
              className="text-2xl font-semibold mt-1"
              style={{ color: theme.text_1 }}
            >
              {value}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const MiniArea: React.FC<{
  data: any[];
  dataKey: string;
  color?: string;
}> = ({ data, dataKey, color = "#06b6d4" }) => (
  <ResponsiveContainer width="100%" height={40}>
    <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id={`mini-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.6} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area
        type="monotone"
        dataKey={dataKey}
        stroke={color}
        fill={`url(#mini-${dataKey})`}
        strokeWidth={2}
      />
    </AreaChart>
  </ResponsiveContainer>
);

export const MetricToggle: React.FC<{
  options: { key: string; label: string }[];
  active: string[];
  onToggle: (k: string) => void;
  theme: any;
}> = ({ options, active, onToggle, theme }) => (
  <div className="flex items-center gap-2">
    {options.map((o) => {
      const isActive = active.includes(o.key);
      return (
        <button
          key={o.key}
          onClick={() => onToggle(o.key)}
          className={`px-3 py-1 rounded-md text-sm font-medium ${
            isActive ? "shadow-md" : "opacity-80"
          }`}
          style={{
            background: isActive
              ? "linear-gradient(90deg,#06b6d4,#7c3aed)"
              : theme.background_2,
            color: isActive ? "#fff" : theme.text_1,
          }}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);

export const TopAssetsTable: React.FC<{
  title: string;
  rows: any[];
  columns: string[];
  theme: any;
}> = ({ title, rows, columns, theme }) => {
  return (
    <div
      className="rounded-2xl p-3"
      style={{ background: theme.cardBackground }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm" style={{ color: theme.text_2 }}>
          {title}
        </div>
        <div className="text-xs text-slate-400">Snapshot</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left border-b" style={{ color: theme.text_2 }}>
            <tr>
              {columns.map((c) => (
                <th key={c} className="py-2">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any, i: number) => (
              <tr key={i} className="border-b" style={{ color: theme.text_2 }}>
                {columns.map((c) => (
                  <td key={c} className="py-3">
                    {r[c] ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-4 text-center text-slate-400"
                >
                  No assets found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const AdsTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      className="p-2 rounded-md"
      style={{ background: "#0b1220", color: "#e6eef8" }}
    >
      <div className="text-xs mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="text-sm">
          <span style={{ color: p.color }}>{p.name}: </span>
          <strong>
            {p.dataKey === "spend"
              ? formatCurrency(p.value)
              : formatInt(p.value)}
          </strong>
        </div>
      ))}
    </div>
  );
};
