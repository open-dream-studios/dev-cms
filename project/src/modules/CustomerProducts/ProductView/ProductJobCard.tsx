// project/src/modules/CustomerProducts/ProductView/ProductJobCard.tsx
import React, { useContext, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Box,
  Check,
  Activity,
  Calendar,
  Clock,
  Tag,
  FolderSearch,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { appTheme } from "@/util/appTheme";
import { AuthContext } from "@/contexts/authContext";
import { getCardStyle } from "@/styles/themeStyles";
import { Job, JobDefinition, Task } from "@/types/jobs";
import { useJobForm } from "@/hooks/useJobForm";
import type { JobFormData } from "@/util/schemas/jobSchema";

/**
 * Props
 */
type Props = {
  job: Job;
  jobDefinition?: JobDefinition | null;
  productIcon?: React.ReactNode;
  tasks?: Task[];
  className?: string;
  onOpen?: (jobId: string | null) => void;
};

const formatDate = (d?: Date | string | null) => {
  if (!d) return "TBD";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const formatDateTime = (d?: Date | null) => {
  if (!d) return "TBD";
  return d.toLocaleString();
};

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

/**
 * Timeline visualization:
 * - shows a compact week or multi-day band from start -> end
 * - working hours (8-17) are lightly highlighted as blocks
 * - progress dot marks scheduled start/complete
 */
const Timeline: React.FC<{
  start?: Date | null;
  end?: Date | null;
  progress?: number; // 0-100
  height?: number;
}> = ({ start, end, progress = 0, height = 56 }) => {
  // If missing dates show a single-day placeholder
  const now = new Date();
  const s = start ? new Date(start) : now;
  const e = end ? new Date(end) : new Date(s.getTime() + 1000 * 60 * 60 * 24);
  // ensure order
  if (e < s) e.setTime(s.getTime() + 1000 * 60 * 60 * 24);

  // compute days span
  const days = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const totalMs = e.getTime() - s.getTime();

  // build day blocks
  const dayBlocks = new Array(days).fill(0).map((_, i) => {
    const dayStart = new Date(s.getFullYear(), s.getMonth(), s.getDate() + i, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 1000 * 60 * 60 * 24);
    return { dayStart, dayEnd };
  });

  const viewWidth = 320; // px of svg track
  const leftPad = 8;
  const rightPad = 8;
  const usable = viewWidth - leftPad - rightPad;

  const posFor = (date: Date) => {
    const frac = clamp((date.getTime() - s.getTime()) / totalMs, 0, 1);
    return leftPad + usable * frac;
  };

  return (
    <div className="w-full select-none">
      <svg width="100%" height={height} viewBox={`0 0 ${viewWidth} ${height}`} preserveAspectRatio="xMidYMid meet">
        {/* background track */}
        <rect x={leftPad} y={height / 2 - 6} rx={6} width={usable} height={12} fill="rgba(255,255,255,0.03)" />

        {/* working-hour highlights per day (8-17) */}
        {dayBlocks.map(({ dayStart }, i) => {
          const workStart = new Date(dayStart.getTime()); workStart.setHours(8,0,0,0);
          const workEnd = new Date(dayStart.getTime()); workEnd.setHours(17,0,0,0);
          // clamp within s..e
          const segStart = new Date(Math.max(s.getTime(), workStart.getTime()));
          const segEnd = new Date(Math.min(e.getTime(), workEnd.getTime()));
          if (segEnd > segStart) {
            const x = posFor(segStart);
            const w = Math.max(2, posFor(segEnd) - x);
            return (
              <rect key={i} x={x} y={height/2 - 6} rx={6} width={w} height={12} fill="rgba(6,182,212,0.12)" />
            );
          }
          return null;
        })}

        {/* filled progress indicator along track */}
        <rect
          x={leftPad}
          y={height / 2 - 6}
          rx={6}
          width={(usable * clamp(progress / 100, 0, 1))}
          height={12}
          fill="url(#grad)"
          opacity={0.95}
        />

        <defs>
          <linearGradient id="grad" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* start and end markers */}
        <circle cx={posFor(s)} cy={height / 2} r={6} fill="#06b6d4" stroke="white" strokeWidth={1.5} />
        <circle cx={posFor(e)} cy={height / 2} r={6} fill={progress >= 100 ? "#22c55e" : "#7c3aed"} stroke="white" strokeWidth={1.5} />

        {/* label dots for now/progress */}
        <g transform={`translate(0, ${height/2 - 18})`}>
          <text x={posFor(s)} y={-14} fontSize={9} textAnchor="middle" fill="rgba(255,255,255,0.8)">{formatDate(s)}</text>
          <text x={posFor(e)} y={-14} fontSize={9} textAnchor="middle" fill="rgba(255,255,255,0.8)">{formatDate(e)}</text>
        </g>
      </svg>
    </div>
  );
};

/**
 * Main card
 */
const ProductJobCard: React.FC<Props> = ({
  job,
  jobDefinition,
  productIcon,
  tasks = [],
  className = "",
  onOpen,
}) => {
  const { currentUser } = useContext(AuthContext);
  const theme = currentUser?.theme ?? "dark";
  const t = appTheme[theme];
  const icon = productIcon ?? <Box size={18} />;

  // small local UI state for note editor open
  const [noteOpen, setNoteOpen] = useState(false);
  const [showTasks, setShowTasks] = useState(false);

  const form = useJobForm({
    status: job.status as any,
    priority: job.priority as any,
    scheduled_date: job.scheduled_start_date ?? undefined,
    completed_date: job.completed_date ?? undefined,
    notes: job.notes ?? undefined,
  });

  // derive simple progress from tasks complete ratio (fallback to 0)
  const progress = useMemo(() => {
    if (!tasks.length) return job.status === "complete" ? 100 : 0;
    const done = tasks.filter((t) => t.status === "complete").length;
    return Math.round((done / tasks.length) * 100);
  }, [tasks, job.status]);

  return (
    <div
      className={`w-full rounded-2xl p-4 ${className}`}
      style={getCardStyle(theme, t)}
    >
      {/* top row */}
      <div className="flex items-start justify-between gap-4">
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
            <div style={{ color: t.text_1 }} className="text-lg font-semibold leading-tight">
              {`${jobDefinition?.type ?? "Untitled"} Job`}
            </div>

            <div className="flex items-center gap-2 mt-1">
              <div className="text-xs" style={{ color: t.text_2 }}>
                {jobDefinition?.type ?? "Job"}
              </div>

              <div
                className={`text-xs rounded-full px-2 py-1 font-medium`}
                style={{
                  backgroundColor: job.status === "complete" ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.03)",
                  color: job.status === "complete" ? "rgb(34,197,94)" : t.text_2,
                }}
              >
                {job.status.replace("_", " ")}
              </div>

              <div className="text-xs rounded-full px-2 py-1 font-medium" style={{ backgroundColor: "rgba(255,255,255,0.02)", color: t.text_2 }}>
                Priority: <span className="ml-1 font-semibold" style={{ color: t.text_1 }}>{job.priority}</span>
              </div>
            </div>

            <div className="text-xs mt-2" style={{ color: t.text_2 }}>
              Scheduled: <span style={{ color: t.text_1 }} className="font-semibold">{formatDate(job.scheduled_start_date)}</span>
              <span className="mx-3">•</span>
              Completed: <span style={{ color: t.text_1 }} className="font-semibold">{formatDate(job.completed_date)}</span>
            </div>
          </div>
        </div>

        {/* right: compact progress and actions */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <div className="text-xs" style={{ color: t.text_2 }}>Job Progress</div>
            <motion.div
              initial={{ scale: 0.96, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.28 }}
              className="mt-2"
            >
              {/* circular simple progress */}
              <div className="relative w-[64px] h-[64px]">
                <svg viewBox="0 0 36 36" className="w-full h-full block">
                  <defs>
                    <linearGradient id="g1" x1="0%" x2="100%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M18 2.0845
                       a 15.9155 15.9155 0 0 1 0 31.831
                       a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845
                       a 15.9155 15.9155 0 0 1 0 31.831"
                    fill="none"
                    stroke="url(#g1)"
                    strokeWidth="3"
                    strokeDasharray={`${clamp(progress,0,100) / 100 * 100} 100`}
                    strokeLinecap="round"
                  />
                  <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" fontSize="7" fill="white" style={{ fontWeight: 700 }}>
                    {Math.round(progress)}%
                  </text>
                </svg>
              </div>
            </motion.div>
          </div>

          <div>
            <button
              onClick={() => onOpen?.(job.job_id)}
              className="px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer dim"
              style={{
                background: "linear-gradient(90deg,#06b6d4,#7c3aed)",
                color: "#fff",
                boxShadow: "0 6px 18px rgba(124,58,237,0.12)",
              }}
            >
              Open
            </button>
          </div>
        </div>
      </div>

      {/* divider */}
      <div className="w-full h-[1px] my-4" style={{ background: theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.06)" }} />

      {/* Lower content: left (description + notes + schedule) | right (timeline + controls + mini-tasks) */}
      <div className="flex gap-4 items-start">
        {/* LEFT column - wide */}
        <div
          className="flex-1 rounded-xl p-4"
          style={{
            background: theme === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.03)",
            border: theme === "dark" ? "1px solid rgba(255,255,255,0.03)" : undefined,
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm" style={{ color: t.text_2 }}>Description</div>
              <div className="mt-2 text-xs" style={{ color: t.text_2 }}>
                {jobDefinition?.description ?? "No job description available. Add details about what needs to be done for this tub."}
              </div>
            </div>

            <div className="text-xs text-right" style={{ color: t.text_2 }}>
              <div>Last update</div>
              {job.updated_at && <div className="font-semibold" style={{ color: t.text_1 }}> {formatDateTime(job.updated_at ? new Date() : undefined)}</div>}
            </div>
          </div>

          {/* Notes editor */}
          <div className="mt-4">
            <div className="text-xs mb-2" style={{ color: t.text_2 }}>Notes</div>

            <div
              className={`relative rounded-[8px] transition-all duration-200 ${noteOpen ? "h-[150px]" : "h-[56px]"}`}
              style={{
                backgroundColor: appTheme[theme].background_2,
              }}
            >
              <textarea
                {...form.register("notes" as any)}
                className="w-[calc(100%-45px)] h-[100%] text-[14px] opacity-[0.9] outline-none border-none resize-none bg-transparent px-3 py-2 rounded-[7px]"
                placeholder="Add a note about the job..."
              />

              <div
                onClick={() => setNoteOpen((p) => !p)}
                className="flex justify-center items-center cursor-pointer hover:brightness-90 dim w-[36px] h-[30px] right-[10px] top-[8px] absolute z-[300]"
              >
                {noteOpen ? <ChevronUp size={16} className="opacity-60" /> : <ChevronDown size={16} className="opacity-60" />}
              </div>
            </div>
          </div>

          {/* small metadata row */}
          <div className="mt-3 flex flex-wrap gap-3 items-center text-xs" style={{ color: t.text_2 }}>
            <div className="flex items-center gap-2">
              <Calendar size={14} /> <span>{formatDate(job.scheduled_start_date)}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock size={14} /> <span>{formatDate(job.completed_date)}</span>
            </div>

            <div className="flex items-center gap-2">
              <Tag size={14} /> <span>{job.job_id ?? "—"}</span>
            </div>
          </div>
        </div>

        {/* RIGHT column - narrow */}
        <div className="w-[360px] grid grid-rows-[auto_auto_1fr] gap-3">
          {/* timeline mini-card */}
          <div
            className="rounded-xl p-3"
            style={{
              background: theme === "dark" ? "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))" : "rgba(0,0,0,0.03)",
              border: theme === "dark" ? "1px solid rgba(255,255,255,0.03)" : undefined,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs" style={{ color: t.text_2 }}>Schedule</div>
              <div className="text-xs font-semibold" style={{ color: t.text_1 }}>
                {formatDate(job.scheduled_start_date)} — {formatDate(job.completed_date)}
              </div>
            </div>

            <div className="mt-3">
              <Timeline start={job.scheduled_start_date ?? undefined} end={job.completed_date ?? undefined} progress={progress} height={64} />
            </div>

            <div className="mt-2 flex items-center text-xs" style={{ color: t.text_2 }}>
              <Clock size={14} /> <span className="ml-2">{job.scheduled_start_date ? new Date(job.scheduled_start_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
            </div>
          </div>

          {/* controls mini-card */}
          <div
            className="rounded-xl p-3 flex flex-col gap-3"
            style={{
              background: theme === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.03)",
              border: theme === "dark" ? "1px solid rgba(255,255,255,0.03)" : undefined,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs" style={{ color: t.text_2 }}>Status</div>
              <div className="text-xs font-semibold" style={{ color: t.text_1 }}>
                {job.status.replace("_", " ")}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                {...form.register("status" as any)}
                className="w-full rounded-md px-3 py-2 text-sm outline-none cursor-pointer"
                style={{ background: appTheme[theme].background_3, color: t.text_1 }}
              >
                <option value="waiting_diagnosis">waiting_diagnosis</option>
                <option value="waiting_work">waiting_work</option>
                <option value="waiting_parts">waiting_parts</option>
                <option value="waiting_listing">waiting_listing</option>
                <option value="waiting_customer">waiting_customer</option>
                <option value="waiting_delivery">waiting_delivery</option>
                <option value="complete">complete</option>
                <option value="delivered">delivered</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-xs" style={{ color: t.text_2 }}>Priority</div>
              <select
                {...form.register("priority" as any)}
                className="ml-auto rounded-md px-3 py-2 text-sm outline-none cursor-pointer"
                style={{ background: appTheme[theme].background_3, color: t.text_1 }}
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="urgent">urgent</option>
              </select>
            </div>
          </div>

          {/* tasks mini-list */}
          <div
            className="rounded-xl p-3 overflow-hidden"
            style={{
              background: theme === "dark" ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.02)",
              border: theme === "dark" ? "1px solid rgba(255,255,255,0.02)" : undefined,
              minHeight: 120,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs" style={{ color: t.text_2 }}>Tasks</div>
              <div onClick={() => setShowTasks((s) => !s)} className="cursor-pointer dim">
                {showTasks ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            <div className={`mt-3 space-y-2 transition-all ${showTasks ? "max-h-[480px]" : "max-h-[92px] overflow-hidden"}`}>
              {tasks.length === 0 && (
                <div className="text-xs" style={{ color: t.text_2 }}>
                  No tasks yet — add steps required to finish this job.
                </div>
              )}

              {tasks.slice(0, 6).map((task) => (
                <div key={task.task_id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-[34px] h-[34px] rounded-md flex items-center justify-center" style={{ background: "rgba(255,255,255,0.02)" }}>
                      {task.status === "complete" ? <Check size={16} /> : <Activity size={16} />}
                    </div>
                    <div className="text-xs">
                      <div style={{ color: t.text_1 }} className="font-semibold text-[13px]">{task.task_definition_id ? `Task ${task.task_definition_id}` : "Task"}</div>
                      <div style={{ color: t.text_2 }} className="text-[12px]">{task.notes ?? "—"}</div>
                    </div>
                  </div>

                  <div className="text-xs" style={{ color: t.text_2 }}>
                    {task.scheduled_start_date ? formatDate(task.scheduled_start_date) : "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductJobCard;