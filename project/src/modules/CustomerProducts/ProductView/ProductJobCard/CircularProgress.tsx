// project/src/modules/CustomerProducts/ProductView/ProductJobCard/CircularProgress.tsx
import React from "react";
import "../../../components/Calendar/Calendar.css";

// ---------- CircularProgress ----------
const CircularProgress: React.FC<{
  value: number; // 0-100
  size?: number;
  stroke?: number;
  color?: string;
  bg?: string;
}> = ({
  value,
  size = 56,
  stroke = 7,
  color = "#06b6d4",
  bg = "rgba(255,255,255,0.06)",
}) => {
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (value / 100) * circumference;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="block"
    >
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke={bg}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
      />
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
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={11.2}
        style={{ fontWeight: 700, fill: "white", opacity: 0.5 }}
      >
        {Math.round(value)}%
      </text>
    </svg>
  );
};


export default CircularProgress;