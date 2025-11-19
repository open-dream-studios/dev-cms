export function formatCurrency(n: number) {
  if (isNaN(n)) return "$0";
  return `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
export function formatInt(n: number) {
  if (!n && n !== 0) return "0";
  return n.toLocaleString();
}
export function percent(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

export const CAMPAIGN_TYPE_MAP = {
  0: "UNSPECIFIED",
  1: "UNKNOWN",
  2: "SEARCH",
  3: "DISPLAY",
  4: "SHOPPING",
  5: "HOTEL",
  6: "VIDEO",
  7: "APP",
  8: "LOCAL",
  9: "SMART",
  10: "PERFORMANCE_MAX",
  11: "LOCAL_SERVICES",
  12: "DISCOVERY",
  13: "TRAVEL",
} as const;

export const metricOptions = [
  { key: "spend", label: "Spend" },
  { key: "impressions", label: "Impr" },
  { key: "clicks", label: "Clicks" },
  { key: "conversions", label: "Conv" },
];
