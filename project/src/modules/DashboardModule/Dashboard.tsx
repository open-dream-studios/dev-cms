// project/src/modules/DashboardModule/Dashboard.tsx
import React, { useContext, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import {
  Search,
  Activity,
  DollarSign,
  Users,
  BarChart2,
  RefreshCw,
  Zap,
} from "lucide-react";
import { appTheme } from "@/util/appTheme";
import { AuthContext } from "@/contexts/authContext"; 
import { useCurrentDataStore } from "@/store/currentDataStore";

// -- Helper: fake data -----------------------------------------------------
const salesData = [
  { month: "Jan", revenue: 4200, orders: 420, conv: 2.1 },
  { month: "Feb", revenue: 3800, orders: 370, conv: 1.9 },
  { month: "Mar", revenue: 5900, orders: 610, conv: 3.2 },
  { month: "Apr", revenue: 6700, orders: 690, conv: 3.5 },
  { month: "May", revenue: 7200, orders: 740, conv: 3.8 },
  { month: "Jun", revenue: 8100, orders: 860, conv: 4.1 },
  { month: "Jul", revenue: 9000, orders: 920, conv: 4.6 },
  { month: "Aug", revenue: 9800, orders: 1040, conv: 5.0 },
];

const adCampaigns = [
  { id: 1, name: "HYPER-CTR Q3", conv: 1240, cost: 8200, roas: 3.2 },
  { id: 2, name: "Search-Performance", conv: 890, cost: 5400, roas: 2.6 },
  { id: 3, name: "Social-Surge", conv: 670, cost: 3100, roas: 4.1 },
  { id: 4, name: "Branded-Bias", conv: 420, cost: 900, roas: 6.8 },
];

const productRows = [
  {
    id: "P-001",
    name: "NeuroWidget Pro",
    sold: 420,
    revenue: 37800,
    conv: "4.6%",
  },
  {
    id: "P-002",
    name: "Streamline Kit",
    sold: 320,
    revenue: 25600,
    conv: "3.2%",
  },
  {
    id: "P-003",
    name: "AdStream Micro",
    sold: 260,
    revenue: 19600,
    conv: "2.9%",
  },
  {
    id: "P-004",
    name: "Lite Analytics",
    sold: 190,
    revenue: 11400,
    conv: "1.8%",
  },
];

const trafficSources = [
  { name: "Organic Search", value: 42 },
  { name: "Paid Social", value: 26 },
  { name: "Direct", value: 18 },
  { name: "Referral", value: 8 },
  { name: "Email", value: 6 },
];

const timeline = [
  {
    time: "08:10",
    title: "High-value conversion",
    content: "Order #6392 placed — $4,200",
    level: "info",
  },
  {
    time: "08:01",
    title: "Ad anomaly detected",
    content: "CTR spike in Social-Surge",
    level: "alert",
  },
  {
    time: "07:45",
    title: "Daily cadence report",
    content: "Revenue +6.2% vs yesterday",
    level: "info",
  },
];

const COLORS = ["#22d3ee", "#7c3aed", "#06b6d4", "#60a5fa", "#f97316"];

// -- Small UI pieces ------------------------------------------------------
function formatCurrency(n: any) {
  return `$${n.toLocaleString()}`;
}

function MetricCard({ title, value, delta, icon }: any) {
  const { currentUser } = useContext(AuthContext);
  if (!currentUser) return null;
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className={`${
        currentUser.theme === "dark"
          ? "bg-gradient-to-b from-white/3 to-transparent border border-white/6"
          : "drop-shadow-lg"
      } cursor-pointer hover:brightness-75 dim border border-white/6 rounded-2xl p-4 shadow-2xl backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="w-[100%] flex items-center gap-3">
          <div
            className="p-3 rounded-xl"
            style={{
              backgroundColor: appTheme[currentUser.theme].background_3,
            }}
          >
            {icon}
          </div>
          <div className="w-[100%] h-[100%]">
            <div className="flex flex-row justify-between w-[100%]">
              <div
                className="text-sm"
                style={{
                  color: appTheme[currentUser.theme].text_1,
                }}
              >
                {title}
              </div>
              <div
                className={`text-sm ${
                  delta >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {delta >= 0 ? `+${delta}%` : `${delta}%`}
              </div>
            </div>
            <div
              className="text-2xl font-semibold mt-1"
              style={{
                color: appTheme[currentUser.theme].text_1,
              }}
            >
              {value}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MiniArea({ data, dataKey }: any) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke="#06b6d4"
          fillOpacity={1}
          fill="url(#g)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// -- Main exported dashboard ----------------------------------------------
const Dashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentProject } = useCurrentDataStore();
  const [range, setRange] = useState("30d");

  const totalRevenue = useMemo(
    () => salesData.reduce((s, r) => s + r.revenue, 0),
    []
  );
  const totalOrders = useMemo(
    () => salesData.reduce((s, r) => s + r.orders, 0),
    []
  );
  const avgConv = useMemo(
    () =>
      (salesData.reduce((s, r) => s + r.conv, 0) / salesData.length).toFixed(2),
    []
  );

  if (!currentUser || !currentProject) return null;

  return (
    <div
      style={{ backgroundColor: appTheme[currentUser.theme].background_1 }}
      className="min-h-screen text-slate-100 px-6 pt-6 pb-8 font-sans"
    >
      <div className="w-[100%] grid grid-cols-12 gap-6">
        <main className="col-span-12">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <h1
                style={{
                  color: appTheme[currentUser.theme].text_1,
                }}
                className="text-2xl font-bold tracking-tight"
              >
                {currentProject.brand}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="relative rounded-lg"
                style={{
                  backgroundColor: appTheme[currentUser.theme].background_2,
                }}
              >
                <input
                  style={{
                    color: appTheme[currentUser.theme].text_1,
                    ["--placeholder-color" as any]:
                      appTheme[currentUser.theme].text_1,
                  }}
                  placeholder="Search operations..."
                  className="themed-placeholder px-3 py-2 text-sm w-72 overflow-hidden outline-none border-none"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-80">
                  <Search
                    color={appTheme[currentUser.theme].text_1}
                    size={14}
                  />
                </div>
              </div>
              <div
                className="group w-[auto] rounded-lg px-[15px]"
                style={{
                  backgroundColor: appTheme[currentUser.theme].background_2,
                }}
              >
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  style={{
                    color: appTheme[currentUser.theme].text_1,
                  }}
                  className="group-hover:brightness-75 dim cursor-pointer min-w-[100px] py-2 rounded-lg text-sm border-none outline-none"
                >
                  <option value="7d">Last 7d</option>
                  <option value="30d">Last 30d</option>
                  <option value="90d">Last 90d</option>
                  <option value="365d">YTD</option>
                </select>
              </div>
              <button
                style={{
                  backgroundColor: appTheme[currentUser.theme].background_2,
                }}
                className="cursor-pointer hover:brightness-90 dim px-3 py-2 rounded-lg"
              >
                <RefreshCw
                  color={appTheme[currentUser.theme].text_1}
                  size={16}
                />
              </button>
              <button className="cursor-pointer hover:brightness-75 dim px-3 py-2 rounded-lg bg-gradient-to-r from-[#06b6d4] to-[#7c3aed] text-white font-semibold">
                Deploy AI
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <MetricCard
              title="Revenue"
              value={formatCurrency(totalRevenue)}
              delta={8.2}
              icon={<DollarSign />}
            />
            <MetricCard
              title="Orders"
              value={totalOrders}
              delta={4.4}
              icon={<Activity />}
            />
            <MetricCard
              title="Avg Conversion"
              value={`${avgConv}%`}
              delta={3.1}
              icon={<Users />}
            />
            <MetricCard
              title="Ad ROAS"
              value={`~${(
                adCampaigns.reduce((s, c) => s + c.roas, 0) / adCampaigns.length
              ).toFixed(2)}`}
              delta={-1.8}
              icon={<BarChart2 />}
            />
          </div>

          <div className="grid grid-cols-12 gap-4">
            <section
              className={`${
                currentUser.theme === "dark"
                  ? "bg-gradient-to-b from-white/3 to-transparent border border-white/6"
                  : "shadow-2xl"
              } col-span-8 rounded-2xl p-4`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div
                    className="text-sm"
                    style={{
                      color: appTheme[currentUser.theme].text_1,
                    }}
                  >
                    Revenue Timeline
                  </div>
                  <div
                    className="text-lg font-semibold"
                    style={{
                      color: appTheme[currentUser.theme].text_1,
                    }}
                  >
                    Monthly revenue & order volume
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  Projected ARPU: $87.20
                </div>
              </div>

              <div style={{ height: 260 }} className="w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={salesData}
                    margin={{ top: 10, right: 24, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={appTheme[currentUser.theme].text_4}
                    />
                    <XAxis dataKey="month" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ background: "#0b1220" }} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="#7c3aed"
                      strokeWidth={2}
                      dot={false}
                      yAxisId={0}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className={`${currentUser.theme === "dark" ? "bg-white/3" : "bg-black/3"} p-3 rounded-xl`}>
                  <div
                    className="text-xs"
                    style={{
                      color: appTheme[currentUser.theme].text_2,
                    }}
                  >
                    Best Day (30d)
                  </div>
                  <div
                    className="font-semibold text-lg"
                    style={{
                      color: appTheme[currentUser.theme].text_2,
                    }}
                  >
                    July 22 • $12,400
                  </div>
                  <div
                    className="mt-2 text-xs"
                    style={{
                      color: appTheme[currentUser.theme].text_2,
                    }}
                  >
                    Orders: 142 • Conv 6.2%
                  </div>
                </div>

                <div className={`${currentUser.theme === "dark" ? "bg-white/3" : "bg-black/3"} p-3 rounded-xl`}>
                  <div
                    className="text-xs"
                    style={{
                      color: appTheme[currentUser.theme].text_2,
                    }}
                  >
                    Top Product
                  </div>
                  <div
                    className="font-semibold text-lg"
                    style={{
                      color: appTheme[currentUser.theme].text_2,
                    }}
                  >
                    NeuroWidget Pro
                  </div>
                  <div
                    className="mt-2 text-xs"
                    style={{
                      color: appTheme[currentUser.theme].text_2,
                    }}
                  >
                    Revenue: $37,800 • Sold: 420
                  </div>
                </div>

              <div className={`${currentUser.theme === "dark" ? "bg-white/3" : "bg-black/3"} p-3 rounded-xl`}>
                  <div
                    className="text-xs "
                    style={{
                      color: appTheme[currentUser.theme].text_2,
                    }}
                  >
                    Latency
                  </div>
                  <div
                    className="font-semibold text-lg"
                    style={{
                      color: appTheme[currentUser.theme].text_2,
                    }}
                  >
                    45 ms
                  </div>
                  <div
                    className="mt-2 text-xs"
                    style={{
                      color: appTheme[currentUser.theme].text_2,
                    }}
                  >
                    Server load nominal
                  </div>
                </div>
              </div>
            </section>

            <aside className="col-span-4 flex flex-col gap-4 rounded-2xl">
              <div
                className={`${
                  currentUser.theme === "dark"
                    ? "bg-gradient-to-b from-white/3 to-transparent border border-white/6"
                    : "shadow-2xl"
                } rounded-2xl  p-4`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-slate-400">Traffic Sources</div>
                  <div className="text-xs text-slate-400">Real-time</div>
                </div>
                <div style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        dataKey="value"
                        data={trafficSources}
                        innerRadius={42}
                        outerRadius={64}
                        paddingAngle={3}
                      >
                        {trafficSources.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm ">
                  {trafficSources.map((t, i) => (
                    <div key={t.name} className="flex items-center gap-2">
                      <div
                        style={{ background: COLORS[i] }}
                        className="w-3 h-3 rounded-sm"
                      />
                      <div
                        style={{
                          color: appTheme[currentUser.theme].text_2,
                        }}
                      >
                        {t.name}
                      </div>
                      <div
                        style={{
                          color: appTheme[currentUser.theme].text_2,
                        }}
                        className="ml-auto font-semibold "
                      >
                        {t.value}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* <div className="rounded-2xl p-4 bg-gradient-to-b from-white/3 to-white/2 border border-white/6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-slate-400">Top Campaigns</div>
                  <div className="text-xs text-slate-400">Performance</div>
                </div>
                <div className="space-y-3">
                  {adCampaigns.map((c) => (
                    <div key={c.id} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="font-semibold">{c.name}</div>
                        <div className="text-xs text-slate-400">
                          Conversions: {c.conv} • Cost: {formatCurrency(c.cost)}
                        </div>
                      </div>
                      <div className="text-sm font-semibold">
                        ROAS {c.roas.toFixed(1)}x
                      </div>
                    </div>
                  ))}
                </div>
              </div> */}

              <div
                className={`${
                  currentUser.theme === "dark"
                    ? "bg-gradient-to-b from-white/3 to-transparent border border-white/6"
                    : "shadow-2xl"
                } h-[122px] rounded-2xl p-4  flex items-center gap-3`}
              >
                <div className="p-2 rounded-lg bg-white/5">
                  <Zap color={appTheme[currentUser.theme].text_2} />
                </div>
                <div>
                  <div
                    style={{
                      color: appTheme[currentUser.theme].text_2,
                    }}
                    className="text-xs"
                  >
                    AI Suggestion
                  </div>
                  <div
                    style={{
                      color: appTheme[currentUser.theme].text_2,
                    }}
                    className="font-semibold"
                  >
                    Shift 15% budget to Social-Surge for peak times
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <div className="grid grid-cols-12 gap-4 mt-4">
            <section
              className={`${
                currentUser.theme === "dark"
                  ? "bg-gradient-to-b from-white/3 to-transparent border border-white/6"
                  : "shadow-2xl"
              } col-span-8 rounded-2xl p-4`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div
                    className="text-sm"
                    style={{
                      color: appTheme[currentUser.theme].text_2,
                    }}
                  >
                    Top Products
                  </div>
                  <div
                    style={{
                      color: appTheme[currentUser.theme].text_2,
                    }}
                    className="text-lg font-semibold"
                  >
                    Sales performance
                  </div>
                </div>
                <div
                  style={{
                    color: appTheme[currentUser.theme].text_2,
                  }}
                  className="text-xs"
                >
                  Snapshot • Updated 08:28
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead
                    style={{
                      color: appTheme[currentUser.theme].text_2,
                    }}
                    className={`${
                      currentUser.theme === "dark"
                        ? "border-white/6"
                        : "border-black/9"
                    } text-left border-b`}
                  >
                    <tr
                      style={{
                        color: appTheme[currentUser.theme].text_2,
                      }}
                    >
                      <th className="py-2">Product</th>
                      <th className="py-2">Units</th>
                      <th className="py-2">Revenue</th>
                      <th className="py-2">Conv</th>
                      <th className="py-2">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productRows.map((r) => (
                      <tr
                        style={{
                          color: appTheme[currentUser.theme].text_2,
                        }}
                        key={r.id}
                        className={`${
                          currentUser.theme === "dark"
                            ? "border-white/5"
                            : "border-black/7"
                        } border-b`}
                      >
                        <td className="py-3">
                          <div className="font-semibold">{r.name}</div>
                          <div
                            style={{
                              color: appTheme[currentUser.theme].text_2,
                            }}
                            className="text-xs "
                          >
                            SKU {r.id}
                          </div>
                        </td>
                        <td className="py-3">{r.sold}</td>
                        <td className="py-3">{formatCurrency(r.revenue)}</td>
                        <td className="py-3">{r.conv}</td>
                        <td className="py-3">
                          <div className="w-24 h-6">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={salesData}
                                margin={{
                                  top: 0,
                                  right: 0,
                                  left: 0,
                                  bottom: 0,
                                }}
                              >
                                <Area
                                  dataKey="orders"
                                  stroke="#7c3aed"
                                  fillOpacity={0}
                                  dot={false}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <aside
              className={`${
                currentUser.theme === "dark"
                  ? "bg-gradient-to-b from-white/3 to-transparent border border-white/6"
                  : "shadow-2xl"
              } col-span-4 rounded-2xl p-4`}
            >
              <div
                style={{
                  color: appTheme[currentUser.theme].text_2,
                }}
                className="flex items-center justify-between mb-3"
              >
                <div>
                  <div className="text-sm text-slate-400">
                    Activity Timeline
                  </div>
                  <div className="text-lg font-semibold">Live feed</div>
                </div>
                <div className="text-xs text-slate-400">Latency: 45 ms</div>
              </div>

              <div className="mb-4">
                <button className="cursor-pointer hover:brightness-75 dim w-full py-2 rounded-lg bg-gradient-to-r from-[#06b6d4] to-[#7c3aed] text-white font-semibold">
                  Run Diagnostic
                </button>
              </div>

              <div className="space-y-3">
                {timeline.map((t, idx) => (
                  <div
                    key={idx}
                    className="cursor-pointer hover:brightness-75 dim p-3 rounded-xl bg-white/3"
                  >
                    <div
                      style={{
                        color: appTheme[currentUser.theme].text_2,
                      }}
                      className="flex items-center justify-between"
                    >
                      <div className="text-sm font-semibold">{t.title}</div>
                      <div
                        style={{
                          color: appTheme[currentUser.theme].text_2,
                        }}
                        className="text-xs"
                      >
                        {t.time}
                      </div>
                    </div>
                    <div
                      style={{
                        color: appTheme[currentUser.theme].text_2,
                      }}
                      className="text-xs mt-1"
                    >
                      {t.content}
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
