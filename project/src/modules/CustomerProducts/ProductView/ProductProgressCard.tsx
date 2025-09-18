// project/src/modules/CustomerProducts/ProductView/ProductProgressCard.tsx
import React, { useContext } from "react";
import { motion } from "framer-motion";
import { Box, Check, Activity } from "lucide-react";
import { appTheme } from "@/util/appTheme";
import { AuthContext } from "@/contexts/authContext";
import { getCardStyle } from "@/styles/themeStyles";

export type ProductProgress = {
  id: string;
  name: string;
  sku?: string;
  icon?: React.ReactNode;
  progress: number; // 0 - 100
  sold?: number;
  revenue?: number;
  conv?: string;
  eta?: string;
  owner?: string;
};

type Props = {
  product: ProductProgress;
  className?: string;
};

function formatCurrency(n?: number) {
  if (n == null) return "-";
  return `$${n.toLocaleString()}`;
}

const CircularProgress: React.FC<{
  value: number; // 0-100
  size?: number;
  stroke?: number;
  color?: string;
  bg?: string;
}> = ({ value, size = 52, stroke = 6, color = "#06b6d4", bg = "rgba(255,255,255,0.06)" }) => {
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (value / 100) * circumference;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
      {/* background circle */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke={bg}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
      />
      {/* progress circle */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference - dash}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* center text */}
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={12}
        style={{ fontWeight: 700, fill: "white", opacity: 0.95 }}
      >
        {Math.round(value)}%
      </text>
    </svg>
  );
};

const ProductProgressCard: React.FC<Props> = ({ product, className }) => {
  const { currentUser } = useContext(AuthContext);
 
  const theme = currentUser?.theme ?? "dark";
  const t = appTheme[theme];

  const icon = product.icon ?? <Box size={20} />;

  return (
    <div
      className={`w-[100%] rounded-2xl p-4 ${className ?? ""}`}
      style={getCardStyle(theme, t)}
    >
      {/* Top row: icon, name, actions/progress */}
      <div className="flex items-start justify-between w-full">
        <div className="flex items-center gap-4">
          <div
            className="p-3 rounded-xl shadow-sm"
            style={{
              backgroundColor: t.background_3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 56,
              minHeight: 56,
            }}
          >
            <div style={{ color: t.text_1 }}>{icon}</div>
          </div>

          <div className="flex flex-col">
            <div style={{ color: t.text_1 }} className="text-lg font-semibold">
              {product.name}
            </div>
            <div style={{ color: t.text_2 }} className="text-xs mt-1">
              {product.sku ? `SKU ${product.sku}` : "Product"}
            </div>
            <div className="mt-2 flex items-center gap-2">
              {/* small badges */}
              <div
                className="px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  color: t.text_2,
                }}
              >
                {product.owner ?? "Unassigned"}
              </div>

              <div
                className="px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: product.progress >= 100 ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.02)",
                  color: product.progress >= 100 ? "rgb(34,197,94)" : t.text_2,
                }}
              >
                {product.progress >= 100 ? "Ready" : product.progress >= 50 ? "In progress" : "Planning"}
              </div>
            </div>
          </div>
        </div>

        {/* right: compact progress & small action */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <div style={{ color: t.text_2 }} className="text-xs">
              Fixing Progress
            </div>
            <div className="mt-2">
              <CircularProgress
                value={product.progress}
                size={56}
                stroke={6}
                // gradient color mimic
                color={product.progress >= 100 ? "#22c55e" : "#06b6d4"}
                bg={theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
              />
            </div>
          </div>

          <button
            className="cursor-pointer dim px-3 py-2 rounded-lg text-sm font-semibold"
            style={{
              background: "linear-gradient(90deg,#06b6d4,#7c3aed)",
              color: "#fff",
              boxShadow: "0 6px 18px rgba(124,58,237,0.18)",
            }}
            onClick={() => {
              // placeholder; parent can intercept via a wrapper if needed
              // eslint-disable-next-line no-console
              console.log("Open product", product.id);
            }}
          >
            Open
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-[1px] my-4" style={{ background: theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.06)" }} />

      {/* Bottom: job details blocks */}
      <div className="flex items-stretch gap-4 h-[calc(100% - 96px)]">
        {/* left wide block: summary / description */}
        <div
          className="flex-1 rounded-xl p-4"
          style={{
            background: theme === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.03)",
            border: theme === "dark" ? "1px solid rgba(255,255,255,0.03)" : undefined,
          }}
        >
          <div className="text-sm" style={{ color: t.text_2 }}>
            Summary
          </div>
          <div className="mt-2 text-xs" style={{ color: t.text_2 }}>
            {/* sample content; parent can override by putting richer data in product object */}
            This product is currently being fixed across QA and staging. Changes involve performance tweaks and UI patches.
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs">
            <div style={{ color: t.text_2 }}>ETA</div>
            <div style={{ color: t.text_1 }} className="font-semibold">
              {product.eta ?? "TBD"}
            </div>

            <div className="ml-4" style={{ color: t.text_2 }}>
              Last update
            </div>
            <div style={{ color: t.text_1 }} className="font-semibold">
              {/* placeholder: could be replaced by product.lastUpdated */}
              08:32
            </div>
          </div>
        </div>

        {/* right: compact stats blocks */}
        <div className="w-[360px] grid grid-cols-2 gap-3">
          <div
            className="rounded-xl p-3 flex flex-col justify-between"
            style={{
              background: theme === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.03)",
              border: theme === "dark" ? "1px solid rgba(255,255,255,0.03)" : undefined,
            }}
          >
            <div className="text-xs" style={{ color: t.text_2 }}>
              Units Sold
            </div>
            <div className="text-lg font-semibold" style={{ color: t.text_1 }}>
              {product.sold ?? "-"}
            </div>
            <div className="text-xs mt-2" style={{ color: t.text_2 }}>
              {product.sold ? `Since launch` : "\u00A0"}
            </div>
          </div>

          <div
            className="rounded-xl p-3 flex flex-col justify-between"
            style={{
              background: theme === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.03)",
              border: theme === "dark" ? "1px solid rgba(255,255,255,0.03)" : undefined,
            }}
          >
            <div className="text-xs" style={{ color: t.text_2 }}>
              Revenue
            </div>
            <div className="text-lg font-semibold" style={{ color: t.text_1 }}>
              {formatCurrency(product.revenue)}
            </div>
            <div className="text-xs mt-2" style={{ color: t.text_2 }}>
              Gross
            </div>
          </div>

          <div
            className="rounded-xl p-3 flex flex-col justify-between"
            style={{
              background: theme === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.03)",
              border: theme === "dark" ? "1px solid rgba(255,255,255,0.03)" : undefined,
            }}
          >
            <div className="text-xs" style={{ color: t.text_2 }}>
              Conversion
            </div>
            <div className="text-lg font-semibold" style={{ color: t.text_1 }}>
              {product.conv ?? "-"}
            </div>
            <div className="text-xs mt-2" style={{ color: t.text_2 }}>
              Rate
            </div>
          </div>

          <div
            className="rounded-xl p-3 flex flex-col justify-between"
            style={{
              background: theme === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.03)",
              border: theme === "dark" ? "1px solid rgba(255,255,255,0.03)" : undefined,
            }}
          >
            <div className="text-xs" style={{ color: t.text_2 }}>
              Status
            </div>
            <div className="flex items-center gap-2 text-lg font-semibold" style={{ color: t.text_1 }}>
              {product.progress >= 100 ? (
                <>
                  <Check size={16} /> Deployed
                </>
              ) : (
                <>
                  <Activity size={16} /> Working
                </>
              )}
            </div>
            <div className="text-xs mt-2" style={{ color: t.text_2 }}>
              Progress
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductProgressCard;