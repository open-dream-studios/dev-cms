// project/src/modules/Jobs/JobCard.tsx
import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  UIEvent,
  useCallback,
  useLayoutEffect,
} from "react";
import { motion } from "framer-motion";
import {
  Box,
  Check,
  Activity,
  Calendar,
  Clock,
  Tag,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Minimize2,
  Maximize2,
  User,
  Plus,
  Truck,
  Package,
  AlertCircle,
  Edit,
  Trash,
  Clock11,
  MapPin,
} from "lucide-react";
import { appTheme } from "@/util/appTheme";
import { AuthContext } from "@/contexts/authContext";
import { getCardStyle, getInnerCardStyle } from "@/styles/themeStyles";
import type {
  Job,
  JobDefinition,
  Task,
  PriorityOption,
  JobStatusOption,
} from "@/types/jobs";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { FaPlus, FaWrench } from "react-icons/fa6";
import { FaUserLarge } from "react-icons/fa6";

// ---------- helpers ----------
function formatDate(d?: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString();
}
function formatDateTime(d?: Date | null) {
  if (!d) return "—";
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
function clamp(v: number, a = 0, b = 100) {
  return Math.max(a, Math.min(b, v));
}

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

// ---------- StatusBadge ----------
const StatusBadge: React.FC<{
  status: JobStatusOption;
  setStatus: React.Dispatch<React.SetStateAction<JobStatusOption>>;
}> = ({ status, setStatus }) => {
  const mapping: Record<string, { color: string; label: string }> = {
    waiting_diagnosis: { color: "#06b6d4", label: "Waiting On Diagnosis" },
    waiting_work: { color: "#60a5fa", label: "Work Required" },
    waiting_parts: { color: "#f59e0b", label: "Waiting On Parts" },
    waiting_customer: { color: "#f59e0b", label: "Waiting On Customer" },
    waiting_listing: { color: "#8b5cf6", label: "Ready To List" },
    listed: { color: "#8b5cf6", label: "Listed" },
    waiting_delivery: { color: "#60a5fa", label: "Ready For Delivery" },
    delivered: { color: "#16a34a", label: "Delivered" },
    complete: { color: "#16a34a", label: "Complete" },
    cancelled: { color: "#ef4444", label: "Cancelled" },
  };
  const info = mapping[status] ?? {
    color: "#94a3b8",
    label: status || "Unknown",
  };
  return (
    <div
      className="cursor-pointer hover:brightness-75 dim inline-flex items-center gap-2 pl-[12px] pr-[14px] rounded-full text-[13px] font-semibold"
      style={{ background: `${info.color}20`, color: info.color }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: info.color,
          boxShadow: "0 0 8px rgba(0,0,0,0.18)",
        }}
        className="brightness-[140%]"
      />
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as JobStatusOption)}
        className="brightness-[140%] pl-[24px] pr-[5px] rounded-full ml-[-26px] cursor-pointer py-2 text-sm outline-none border-none"
      >
        <option value="waiting_diagnosis">
          {mapping["waiting_diagnosis"].label}
        </option>
        <option value="waiting_work">{mapping["waiting_work"].label}</option>
        <option value="waiting_parts">{mapping["waiting_parts"].label}</option>
        <option value="waiting_customer">
          {mapping["waiting_customer"].label}
        </option>
        <option value="waiting_listing">
          {mapping["waiting_listing"].label}
        </option>
        <option value="listed">{mapping["listed"].label}</option>
        <option value="waiting_delivery">
          {mapping["waiting_delivery"].label}
        </option>
        <option value="delivered">{mapping["delivered"].label}</option>
        <option value="complete">{mapping["complete"].label}</option>
        <option value="cancelled">{mapping["cancelled"].label}</option>
      </select>
    </div>
  );
};

// ---------- ScheduleTimeline ----------
type ScheduleTimelineProps = {
  start?: Date | null;
  end?: Date | null;
  onChange?: (s: Date | null, e: Date | null) => void;
  mini?: boolean;
};

export const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({
  start,
  end,
  onChange,
  mini = false,
}) => {
  // --- context/theme ---
  const { currentUser } = React.useContext(AuthContext);
  const theme = currentUser?.theme ?? "dark";
  const t = appTheme[theme];

  // --- config ---
  const DAY_START_HOUR = 7;
  const DAY_END_HOUR = 22;
  const HOURS = DAY_END_HOUR - DAY_START_HOUR;
  const BUFFER_DAYS = 1500; // => ~4 years forward/back (adjust if desired)
  const CENTER_INDEX = Math.floor(BUFFER_DAYS / 2); // index for "today" week center
  const SNAP_DEBOUNCE = 80; // ms

  // --- state ---
  const [isMini, setIsMini] = useState<boolean>(mini);
  const [localStart, setLocalStart] = useState<Date | null>(start ?? null);
  const [localEnd, setLocalEnd] = useState<Date | null>(end ?? null);

  // keep local in sync with props
  useEffect(() => setLocalStart(start ?? null), [start]);
  useEffect(() => setLocalEnd(end ?? null), [end]);

  // If no start provided, default to today
  const effectiveStart = localStart ?? new Date();
  const effectiveEnd =
    localEnd ??
    new Date((localStart ?? new Date()).getTime() + 2 * 60 * 60 * 1000);

  // weekOffset concept preserved but we compute central index instead
  const [weekCenteredIndex, setWeekCenteredIndex] = useState<number>(() => {
    // calculate index for the week containing effectiveStart (centered in buffer)
    return CENTER_INDEX + weekIndexOffsetForDate(effectiveStart);
  });

  // --- refs ---
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const daysTrackRef = useRef<HTMLDivElement | null>(null);
  const columnWidthRef = useRef<number>(0);
  const containerWidthRef = useRef<number>(0);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const snapTimeoutRef = useRef<number | null>(null);

  // --- helper functions ---
  function weekIndexOffsetForDate(date: Date) {
    // returns number of days offset from "today" index to place the Sunday of date's week
    const today = new Date();
    const thisSunday = new Date(today);
    thisSunday.setHours(0, 0, 0, 0);
    thisSunday.setDate(thisSunday.getDate() - thisSunday.getDay()); // this week's Sunday

    const targetSunday = new Date(date);
    targetSunday.setHours(0, 0, 0, 0);
    targetSunday.setDate(targetSunday.getDate() - targetSunday.getDay());

    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weeksDiff = Math.round(
      (targetSunday.getTime() - thisSunday.getTime()) / msPerWeek
    );
    return weeksDiff * 7; // convert weeks -> days offset
  }

  // Convert a buffer index to an actual Date (the day's midnight)
  const indexToDate = useCallback((index: number) => {
    // center index corresponds to "today" (midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysFromCenter = index - CENTER_INDEX;
    const d = new Date(today);
    d.setDate(today.getDate() + daysFromCenter);
    return d;
  }, []);

  // Convert a Date to buffer index
  const dateToIndex = useCallback((date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round(
      (target.getTime() - today.getTime()) / 86400000
    );
    return CENTER_INDEX + diffDays;
  }, []);

  // Convert time to percentage inside day column (0..100)
  const timeToPct = (d: Date) => {
    const h = d.getHours() + d.getMinutes() / 60;
    return ((h - DAY_START_HOUR) / HOURS) * 100;
  };

  // create the huge days array only once (indexes map to dates on the fly)
  const daysCount = BUFFER_DAYS;
  const daysArray = useMemo(
    () =>
      Array.from({ length: daysCount }).map((_, idx) => {
        const dt = indexToDate(idx);
        return dt;
      }),
    [daysCount, indexToDate]
  );

  // column width: we want 7 columns occupying the visible width
  const recalcColumnSizing = useCallback(() => {
    const container = scrollerRef.current;
    const daysTrack = daysTrackRef.current;
    if (!container || !daysTrack) return;
    const w = container.clientWidth;
    containerWidthRef.current = w;
    const col = Math.max(90, Math.floor(w / 7)); // enforce min width for readability
    columnWidthRef.current = col;
    // set width of days track so each column uses this width
    // but we must set inline style on daysTrack (we'll update children style too)
    daysTrack.style.width = `${col * daysCount}px`;
  }, [daysCount]);

  // setup ResizeObserver to update column sizing
  useLayoutEffect(() => {
    recalcColumnSizing();
    if (!scrollerRef.current) return;
    resizeObserverRef.current = new ResizeObserver(() => {
      recalcColumnSizing();
      // after resize, re-snap to nearest day so visuals align
      snapToNearestDay();
    });
    resizeObserverRef.current.observe(scrollerRef.current);
    return () => {
      resizeObserverRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recalcColumnSizing]);

  // --- blocks calculation for visible week (we still render blocks per day) ---
  // We'll find blocks by comparing effectiveStart/effectiveEnd to each day's day span
  const blocksByIndex = useMemo(() => {
    if (!effectiveStart || !effectiveEnd) return new Map<number, null>();
    const map = new Map<
      number,
      null | {
        topPct: number;
        heightPct: number;
        isStart: boolean;
        isEnd: boolean;
        s: Date;
        e: Date;
      }
    >();
    // We'll compute for all days in buffer (cheap), but you can restrict to visible range if needed
    for (let i = 0; i < daysCount; i++) {
      const day = indexToDate(i);
      const dayStart = new Date(day);
      dayStart.setHours(DAY_START_HOUR, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(DAY_END_HOUR, 0, 0, 0);

      const overlapStart = new Date(
        Math.max(effectiveStart.getTime(), dayStart.getTime())
      );
      const overlapEnd = new Date(
        Math.min(effectiveEnd.getTime(), dayEnd.getTime())
      );
      if (overlapEnd <= overlapStart) {
        map.set(i, null);
      } else {
        const topPct = timeToPct(overlapStart);
        const heightPct = timeToPct(overlapEnd) - topPct;
        map.set(i, {
          topPct,
          heightPct,
          isStart: overlapStart.getTime() === effectiveStart.getTime(),
          isEnd: overlapEnd.getTime() === effectiveEnd.getTime(),
          s: overlapStart,
          e: overlapEnd,
        });
      }
    }
    return map;
  }, [effectiveStart, effectiveEnd, daysCount, indexToDate]);

  // --- initial scroll position & schedule button behavior ---
  // Scroll to a particular index so that the week (7 days) starting at that day's Sunday is visible.
  const scrollToWeekContainingIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const scroller = scrollerRef.current;
      if (!scroller || !columnWidthRef.current) return;
      // We want the left edge to be the Sunday of that week (first column).
      // First compute Sunday index for the provided index
      const dt = indexToDate(index);
      const sunday = new Date(dt);
      sunday.setHours(0, 0, 0, 0);
      sunday.setDate(sunday.getDate() - sunday.getDay());
      const sundayIndex = dateToIndex(sunday);
      const left = sundayIndex * columnWidthRef.current;
      scroller.scrollTo({ left, behavior });
      setWeekCenteredIndex(sundayIndex);
    },
    [indexToDate, dateToIndex]
  );

  // compute index for effectiveStart's week and initialize view
  useEffect(() => {
    const startIndex = dateToIndex(effectiveStart);
    // We want to show the week containing effectiveStart - left aligned (Sunday)
    const sunday = new Date(effectiveStart);
    sunday.setHours(0, 0, 0, 0);
    sunday.setDate(sunday.getDate() - sunday.getDay());
    const sundayIndex = dateToIndex(sunday);

    // set state and scroll after mount
    setTimeout(() => {
      scrollToWeekContainingIndex(sundayIndex, "auto");
    }, 30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // "Schedule" button -> go to week of job start
  const handleGotoScheduleWeek = useCallback(() => {
    if (!localStart) {
      // go to today week
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sunday = new Date(today);
      sunday.setDate(sunday.getDate() - sunday.getDay());
      scrollToWeekContainingIndex(dateToIndex(sunday));
      return;
    }
    const sunday = new Date(localStart);
    sunday.setHours(0, 0, 0, 0);
    sunday.setDate(sunday.getDate() - sunday.getDay());
    scrollToWeekContainingIndex(dateToIndex(sunday));
  }, [localStart, dateToIndex, scrollToWeekContainingIndex]);

  // Snap-to-day behavior: when user stops scrolling, snap to nearest day column start
  const snapToNearestDay = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const scroller = scrollerRef.current;
      if (!scroller || !columnWidthRef.current) return;
      const left = scroller.scrollLeft;
      const idx = Math.round(left / columnWidthRef.current);
      const targetLeft = idx * columnWidthRef.current;
      scroller.scrollTo({ left: targetLeft, behavior });
      setWeekCenteredIndex(idx);
    },
    []
  );

  // debounce wrapper for onScroll
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let running = false;
    const onScroll = () => {
      if (snapTimeoutRef.current) {
        window.clearTimeout(snapTimeoutRef.current);
      }
      // schedule snap after debounce
      snapTimeoutRef.current = window.setTimeout(() => {
        snapToNearestDay("smooth");
      }, SNAP_DEBOUNCE);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      if (snapTimeoutRef.current) {
        window.clearTimeout(snapTimeoutRef.current);
      }
    };
  }, [snapToNearestDay]);

  // horizontal wheel -> translate vertical wheel to horizontal move (nice UX)
  const handleWheel = (ev: React.WheelEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) {
      scroller.scrollLeft += ev.deltaY;
      ev.preventDefault();
    }
  };

  // keyboard: left/right arrow to shift week in mini mode
  const handlePrevWeek = () => {
    const scroller = scrollerRef.current;
    if (!scroller || !columnWidthRef.current) return;
    // move left by 7 columns
    const target = Math.max(
      0,
      scroller.scrollLeft - 7 * columnWidthRef.current
    );
    scroller.scrollTo({ left: target, behavior: "smooth" });
  };
  const handleNextWeek = () => {
    const scroller = scrollerRef.current;
    if (!scroller || !columnWidthRef.current) return;
    const maxLeft = (daysCount - 7) * columnWidthRef.current;
    const target = Math.min(
      maxLeft,
      scroller.scrollLeft + 7 * columnWidthRef.current
    );
    scroller.scrollTo({ left: target, behavior: "smooth" });
  };

  // --- inputs: date/time formatting/parsing ---
  const formatDateInput = (d?: Date | null) =>
    d ? d.toISOString().slice(0, 10) : "";
  const formatTimeInput = (d?: Date | null) =>
    d ? d.toTimeString().slice(0, 5) : "";

  const parseDateTime = (
    dateStr: string,
    timeStr: string,
    fallbackDate?: Date
  ) => {
    if (!dateStr) return null;
    const [y, m, day] = dateStr.split("-").map(Number);
    const [hh = 0, mm = 0] = (timeStr || "").split(":").map(Number);
    return new Date(y, m - 1, day, hh ?? 0, mm ?? 0, 0, 0);
  };

  const applyChange = (sN: Date | null, eN: Date | null) => {
    setLocalStart(sN);
    setLocalEnd(eN);
    onChange?.(sN, eN);
  };

  // --- render ---
  const timeLabelSize = isMini ? "text-[10px]" : "text-[11px]";
  const timelineHeight = isMini ? 120 : HOURS * 40; // px visual height

  const headerHeight = 34;
  const gridHeight = Math.max(48, timelineHeight - headerHeight);

  return (
    <motion.div
      layout
      initial={false}
      className={`w-full rounded-xl ${isMini ? "p-2" : "p-3"} bg-opacity-80`}
      style={getInnerCardStyle ? getInnerCardStyle(theme, t) : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleGotoScheduleWeek}
            className="flex items-center gap-2 px-2 py-1 rounded-md hover:opacity-90 active:scale-95"
            style={{
              background: "linear-gradient(180deg,#0ea5a4,#2563eb)",
              color: "white",
              boxShadow: "0 3px 8px rgba(2,6,23,0.35)",
            }}
          >
            <Calendar size={14} />
            <span className="text-xs font-medium">
              {isMini ? "Sched" : "Schedule"}
            </span>
          </button>

          <button
            onClick={() => setIsMini((m) => !m)}
            className="ml-1 px-2 py-1 rounded-md border border-transparent hover:border-gray-600"
            title={isMini ? "Expand" : "Collapse"}
          >
            {isMini ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
        </div>

        {/* Date/Time controls */}
        <div
          className={`flex items-center gap-2 bg-opacity-60 rounded-md ${
            isMini ? "px-2 py-1" : "px-3 py-1.5"
          }`}
          style={{
            background:
              theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)",
          }}
        >
          <div className="flex items-center gap-1">
            <div className="text-[11px] opacity-80">Start</div>
            <input
              type="date"
              value={formatDateInput(localStart)}
              onChange={(ev) => {
                const dateVal = ev.target.value;
                const curTime = formatTimeInput(localStart) || "09:00";
                const newStart = parseDateTime(
                  dateVal,
                  curTime,
                  localStart ?? new Date()
                );
                applyChange(newStart, localEnd);
              }}
              className="rounded-md px-2 py-1 text-[13px] bg-transparent border border-gray-700"
            />
            <input
              type="time"
              value={formatTimeInput(localStart)}
              onChange={(ev) => {
                const timeVal = ev.target.value;
                const dateVal =
                  formatDateInput(localStart) || formatDateInput(new Date());
                const newStart = parseDateTime(
                  dateVal,
                  timeVal,
                  localStart ?? new Date()
                );
                applyChange(newStart, localEnd);
              }}
              className="rounded-md px-2 py-1 text-[13px] bg-transparent border border-gray-700"
            />
          </div>

          <div className="h-6 w-px bg-gray-700 mx-2" />

          <div className="flex items-center gap-1">
            <div className="text-[11px] opacity-80">End</div>
            <input
              type="date"
              value={formatDateInput(localEnd)}
              onChange={(ev) => {
                const dateVal = ev.target.value;
                const curTime = formatTimeInput(localEnd) || "11:00";
                const newEnd = parseDateTime(
                  dateVal,
                  curTime,
                  localEnd ?? new Date()
                );
                applyChange(localStart, newEnd);
              }}
              className="rounded-md px-2 py-1 text-[13px] bg-transparent border border-gray-700"
            />
            <input
              type="time"
              value={formatTimeInput(localEnd)}
              onChange={(ev) => {
                const timeVal = ev.target.value;
                const dateVal =
                  formatDateInput(localEnd) || formatDateInput(new Date());
                const newEnd = parseDateTime(
                  dateVal,
                  timeVal,
                  localEnd ?? new Date()
                );
                applyChange(localStart, newEnd);
              }}
              className="rounded-md px-2 py-1 text-[13px] bg-transparent border border-gray-700"
            />
          </div>
        </div>
      </div>

      {/* Dates row - separate from calendar */}
      <div
        className="flex items-center justify-between rounded-md px-3 py-2 mb-3"
        style={{
          background:
            theme === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.03)",
          border: "1px solid rgba(255,255,255,0.02)",
        }}
      >
        <div className="flex gap-3 items-center text-[13px]">
          <div className="text-xs opacity-80">From</div>
          <div className="text-sm font-semibold">
            {effectiveStart.toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </div>
        </div>

        <div className="flex gap-3 items-center text-[13px]">
          <div className="text-xs opacity-80">To</div>
          <div className="text-sm font-semibold">
            {effectiveEnd.toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Prev / Next week buttons (still function for navigating weeks) */}
          <button
            onClick={handlePrevWeek}
            className="p-1 rounded-md hover:bg-white/3"
            title="Prev week"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="text-sm opacity-80 px-2">
            {/* display visible week range (compute from current left index if possible) */}
            {/* We'll show the week containing the current centered index */}
            {(() => {
              const sunday = indexToDate(weekCenteredIndex);
              const sundayStart = new Date(sunday);
              sundayStart.setHours(0, 0, 0, 0);
              sundayStart.setDate(sundayStart.getDate() - sundayStart.getDay());
              const saturday = new Date(sundayStart);
              saturday.setDate(saturday.getDate() + 6);
              return `${sundayStart.toLocaleDateString()} – ${saturday.toLocaleDateString()}`;
            })()}
          </div>

          <button
            onClick={handleNextWeek}
            className="p-1 rounded-md hover:bg-white/3"
            title="Next week"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendar area */}
      <div
        className="w-full overflow-hidden rounded-md pb-[20px]"
        style={{ border: "1px solid rgba(255,255,255,0.03)" }}
      >
        <div className="flex">
          {/* Time labels column */}
          <div
            className={`relative ${timeLabelSize} opacity-70`}
            style={{ minWidth: 56 }}
          >
            {/* spacer to match the date header height so everything lines up */}
            <div style={{ height: `${headerHeight}px` }} />

            {/* labels container (absolute labels placed at the exact same percentage positions as the grid lines) */}
            <div style={{ height: `${gridHeight}px`, position: "relative" }}>
              {Array.from({ length: HOURS + 1 }).map((_, h) => {
                const topPct = (h / HOURS) * 100;
                const hourLabel = DAY_START_HOUR + h;
                return (
                  <div
                    key={h}
                    style={{
                      position: "absolute",
                      left: 8,
                      transform: "translateY(-50%)",
                      top: `${topPct}%`,
                      whiteSpace: "nowrap",
                    }}
                    className="text-[11px] opacity-90"
                  >
                    {hourLabel}:00
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scrollable days track (horizontal) */}
          <div
            ref={scrollerRef}
            className={`flex-1 overflow-x-auto overflow-y-hidden touch-pan-x ${
              isMini ? "" : "scroll-smooth"
            } hide-scrollbar`}
            style={{
              WebkitOverflowScrolling: "touch",
              scrollSnapType: isMini ? undefined : "x mandatory",
            }}
            onWheel={handleWheel}
          >
            <div
              ref={daysTrackRef}
              className="relative"
              style={{
                width: `${
                  (columnWidthRef.current ||
                    Math.max(
                      90,
                      Math.floor((containerWidthRef.current || 700) / 7)
                    )) * daysArray.length
                }px`,
              }}
            >
              {/* Date header row (scrolls horizontally with columns) */}
              <div
                className="flex items-center border-gray-700 ml-[1px]"
                style={{ height: `${headerHeight - 5}px`, zIndex: 20 }}
              >
                {daysArray.map((d, idx) => {
                  const colW =
                    columnWidthRef.current ||
                    Math.max(
                      90,
                      Math.floor((containerWidthRef.current || 700) / 7)
                    );
                  return (
                    <div
                      key={idx}
                      className="flex-shrink-0 flex items-center justify-center border-r border-gray-700"
                      style={{ width: `${colW}px`, padding: "6px 4px" }}
                    >
                      <div className="text-center text-xs font-semibold">
                        {d.toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grid area (directly under the date header) */}
              <div
                className="flex"
                style={{ height: `${gridHeight}px`, position: "relative" }}
              >
                {daysArray.map((d, idx) => {
                  const colW =
                    columnWidthRef.current ||
                    Math.max(
                      90,
                      Math.floor((containerWidthRef.current || 700) / 7)
                    );
                  const blk = blocksByIndex.get(idx);
                  return (
                    <div
                      key={idx}
                      className="relative border-l border-gray-700 flex-shrink-0"
                      style={{
                        width: `${colW}px`,
                        height: `${gridHeight}px`,
                        scrollSnapAlign: "start",
                        padding: "0 8px",
                      }}
                    >
                      {/* hour grid lines (exact same percentage positions as time labels) */}
                      {Array.from({ length: HOURS + 1 }).map((_, h) => (
                        <div
                          key={h}
                          className="absolute left-0 right-0 border-t border-gray-800"
                          style={{ top: `${(h / HOURS) * 100}%` }}
                        />
                      ))}

                      <div
                        className="absolute left-0 right-0 border-t border-gray-800"
                        style={{ bottom: 0 }}
                      />

                      {/* job block (positioned relative to the column's gridHeight via percentages) */}
                      {blk && blk !== null && (
                        <div
                          className="absolute left-2 right-2 rounded-md text-[11px] flex items-center justify-center"
                          style={{
                            top: `${blk.topPct}%`,
                            height: `${blk.heightPct}%`,
                            background:
                              "linear-gradient(180deg,#06b6d4,#3b82f6)",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.32)",
                            color: "white",
                            borderRadius: 8,
                            padding: "4px 6px",
                          }}
                        >
                          <div className="flex flex-col items-center">
                            <div className="text-[12px] font-semibold">Job</div>
                            {!isMini && (
                              <div className="text-[11px] opacity-90">
                                {blk.s.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                —{" "}
                                {blk.e.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* mini footer controls */}
      {isMini ? (
        <div className="mt-2 text-xs opacity-70 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevWeek}
              className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/7"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="px-2">Week view</div>
            <button
              onClick={handleNextWeek}
              className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/7"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <div>
            <button
              onClick={() => setIsMini(false)}
              className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/7"
            >
              Expand
            </button>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
};

// ---------- TaskCard ----------
const TaskCard: React.FC<{ task: Task; idx: number }> = ({ task, idx }) => {
  // fake part data example (you'd replace with real part listing)
  const fakeParts =
    idx % 2 === 0
      ? [
          { id: "p1", name: "Valve kit", qty: 1, status: "on_order" },
          { id: "p2", name: "Rubber seal", qty: 2, status: "in_stock" },
        ]
      : [{ id: "p3", name: "Filter", qty: 1, status: "missing" }];

  const completed = task.status === "complete";

  return (
    <div
      className="rounded-xl p-3 flex gap-3 items-start"
      style={{
        background: "rgba(255,255,255,0.01)",
        border: "1px solid rgba(255,255,255,0.02)",
      }}
    >
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center"
        style={{
          background: completed
            ? "rgba(34,197,94,0.12)"
            : "rgba(6,182,212,0.06)",
        }}
      >
        {completed ? <Check size={18} /> : <Activity size={18} />}
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">
              {task.task_definition_id
                ? `Task #${task.task_definition_id}`
                : `Task ${task.task_id ?? idx + 1}`}
            </div>
            <div className="text-xs mt-1 opacity-80">
              {task.notes ?? "No additional notes"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              defaultValue={task.status}
              className="text-xs rounded px-2 py-1"
            >
              <option value="waiting_work">Waiting</option>
              <option value="waiting_parts">Parts</option>
              <option value="waiting_customer">Customer</option>
              <option value="complete">Complete</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              defaultValue={task.priority ?? "medium"}
              className="text-xs rounded px-2 py-1"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs opacity-80">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Clock size={14} /> {formatDate(task.scheduled_start_date)}
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={14} /> {formatDate(task.completed_date)}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs">Parts</div>
            <div className="flex items-center gap-2">
              {fakeParts.map((p) => (
                <div
                  key={p.id}
                  className="px-2 py-1 rounded-full text-[11px]"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  {p.name} ×{p.qty}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- JobCard (main) ----------
type ProductJobProps = {
  productJob?: Job | null;
  matchedDefinition?: JobDefinition | null;
  className?: string;
};

const ProductJobCard2: React.FC<ProductJobProps> = ({
  productJob: jobProp,
  matchedDefinition: jobDefProp,
  className,
}) => {
  const { currentUser } = useContext(AuthContext);
  const { tasks: allTasks } = useContextQueries();
  const theme = currentUser?.theme ?? "dark";
  const t = appTheme[theme];

  // fake tasks if not provided
  const defaultTasks: Task[] = [
    {
      task_id: "T-001",
      task_definition_id: 1,
      job_id: 1,
      status: "waiting_work",
      priority: "high",
      scheduled_start_date: new Date(),
      completed_date: null,
      notes: "Inspect outer shell and remove corrosion",
    },
    {
      task_id: "T-002",
      task_definition_id: 2,
      job_id: 1,
      status: "waiting_parts",
      priority: "medium",
      scheduled_start_date: new Date(Date.now() + 1000 * 60 * 60 * 24),
      completed_date: null,
      notes: "Replace valve kit",
    },
    {
      task_id: "T-003",
      task_definition_id: 3,
      job_id: 1,
      status: "complete",
      priority: "low",
      scheduled_start_date: new Date(Date.now() - 1000 * 60 * 60 * 24),
      completed_date: new Date(),
      notes: "Clean & polish",
    },
  ];

  const tasks = useMemo(() => {
    return defaultTasks;
    // if (!jobProp) return [];
    // return allTasks.filter((task: Task) => task.job_id === jobProp.id);
  }, [allTasks]);

  // fallback fake job when not provided (so you can preview)
  const fakeJob: Job = {
    job_id: "J-0001",
    job_definition_id: 1,
    product_id: 12,
    customer_id: 5,
    status: "waiting_work" as JobStatusOption,
    priority: "medium" as PriorityOption,
    scheduled_start_date: new Date(),
    completed_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    notes:
      "Check waterline, replace worn seals, test motor and dry-run for 30 minutes.",
  };

  const job = jobProp ?? fakeJob;

  const defaultDef: JobDefinition = {
    job_definition_id: "JD-01",
    type: "Refurbishment",
    description:
      "Full refurb including seals, motor test, cosmetics, and final QA.",
  };
  const jobDefinition = jobDefProp ?? defaultDef;

  const completedCount = tasks.filter((t) => t.status === "complete").length;
  const progressPct = Math.round(
    (completedCount / Math.max(1, tasks.length)) * 100
  );

  const [noteOpen, setNoteOpen] = useState(false);
  const [notes, setNotes] = useState(job.notes ?? "");
  const [startDate, setStartDate] = useState<Date | null>(
    job.scheduled_start_date ?? null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    job.completed_date ?? null
  );
  const [assigned, setAssigned] = useState<string | null>("Unassigned");
  const [localStatus, setLocalStatus] = useState<JobStatusOption>(
    job.status as JobStatusOption
  );
  const [priority, setPriority] = useState<PriorityOption>(
    job.priority as PriorityOption
  );
  const [tasksCollapsed, setTasksCollapsed] = useState(false);

  function addTask() {
    const newTask: Task = {
      task_id: `T-${Math.floor(Math.random() * 9000 + 1000)}`,
      job_id: job.id ?? 1,
      task_definition_id: null,
      status: "waiting_work",
      priority: "medium",
      scheduled_start_date: null,
      completed_date: null,
      notes: "New task",
    };
    // setTasks((p) => [newTask, ...p]);
  }

  return (
    <div
      className={`w-full rounded-2xl p-4 ${className ?? ""}`}
      style={getCardStyle(theme, t)}
    >
      {/* TOP ROW */}
      <div className="flex items-start justify-between w-full">
        <div className="flex items-center gap-[15px]">
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
            <FaWrench
              size={20}
              className="opacity-[0.65]"
              style={{ color: t.text_1 }}
            />
          </div>

          <div className="flex flex-col">
            <div
              style={{ color: t.text_1 }}
              className="text-[20px] leading-[24px] font-semibold"
            >
              {jobDefinition.type} {" Job"}
            </div>

            <div className="mt-[7.5px] flex items-center gap-2">
              <div className="opacity-[0.4] mt-[-3px] text-[15px] font-medium">
                Priority
              </div>
              <div
                className="rounded-full pr-[10px]"
                style={{
                  background:
                    priority === "urgent"
                      ? "rgba(239,68,68,0.12)"
                      : priority === "high"
                      ? "#f59e0b20"
                      : t.background_2,
                }}
              >
                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as PriorityOption)
                  }
                  style={{
                    color:
                      priority === "urgent"
                        ? "#ef4444"
                        : priority === "high"
                        ? "#f59e0b"
                        : t.text_1,
                    filter:
                      priority === "urgent" || priority === "high"
                        ? "brightness(140%)"
                        : "none",
                  }}
                  className="cursor-pointer hover:brightness-[80%] dim font-[600] outline-none border-none rounded-full pl-[10px] w-[90px] pt-[2px] pb-[4px] text-[14px]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* top-right compact */}
        <div
          className="mt-[-4px] flex items-center gap-[15px] py-[6.5px] px-[12px] rounded-[10px]"
          style={getInnerCardStyle(theme, t)}
        >
          <div className="flex flex-col gap-[7px]">
            <p className="ml-[2.5px] mt-[-3px] font-[500] text-[13px] leading-[15px] opacity-[0.26]">
              Job Status
            </p>
            <StatusBadge status={localStatus} setStatus={setLocalStatus} />
          </div>
          <CircularProgress
            value={progressPct}
            size={55}
            stroke={8}
            color={progressPct >= 100 ? "#22c55e" : "#06b6d4"}
            bg={
              theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"
            }
          />

          {/* <button
            className="cursor-pointer px-3 py-2 rounded-lg text-sm font-semibold"
            style={{
              background: "linear-gradient(90deg,#06b6d4,#7c3aed)",
              color: "#fff",
              boxShadow: "0 6px 18px rgba(124,58,237,0.18)",
            }}
            onClick={() => {
              // placeholder
              console.log("Open job", job.job_id);
            }}
          >
            Open
          </button> */}
        </div>
      </div>

      {/* MIDDLE */}
      <div className="w-[100%] h-auto mt-[14px] gap-[16px] flex flex-col">
        <div className="flex flex-row gap-3">
          <div
            className="rounded-xl px-[15px] pt-[11px] pb-[16px] w-[100%]"
            style={getInnerCardStyle(theme, t)}
          >
            <div className="flex items-start justify-between">
              <div>
                <div
                  className="text-[15px] font-[600] ml-[3px]"
                  style={{ color: t.text_2 }}
                >
                  Job Details
                </div>
              </div>

              <div className="flex items-center mt-[2.5px] text-xs gap-[6px] flex-row opacity-[0.6]">
                <Clock size={14} className="ml-[4px]" />
                <div className="ml-[1px]">Updated</div>
                <div
                  className="font-semibold opacity-[0.85]"
                  style={{ color: t.text_1 }}
                >
                  {formatDateTime(new Date())}
                </div>
              </div>
            </div>

            <div className="mt-[10.5px]">
              <div
                className={`relative rounded-[8px] transition-all duration-200 ${
                  noteOpen ? "h-[210px]" : "h-[56px]"
                }`}
                style={{ backgroundColor: appTheme[theme].background_2 }}
              >
                <textarea
                  value={notes ?? ""}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-[calc(100%-45px)] h-[100%] text-[14px] opacity-[0.95] outline-none border-none resize-none bg-transparent px-3 py-2 rounded-[7px]"
                  placeholder="Details..."
                />

                <div
                  onClick={() => setNoteOpen((p) => !p)}
                  className="flex justify-center items-center cursor-pointer hover:brightness-90 dim w-[36px] h-[30px] right-[3px] top-[0px] absolute z-[300]"
                >
                  {noteOpen ? (
                    <ChevronUp size={22} className="opacity-30" />
                  ) : (
                    <ChevronDown size={22} className="opacity-30" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl px-[15px] py-[11px] w-[100%]"
            style={getInnerCardStyle(theme, t)}
          >
            <div className="flex items-start justify-between">
              <div>
                <div
                  className="text-[15px] font-[600] ml-[3px]"
                  style={{ color: t.text_2 }}
                >
                  Assignment
                </div>
              </div>
              <div className="flex items-center gap-2 text-[13px] opacity-[0.45]">
                <Tag size={14} /> <span>{job.job_id ?? "—"}</span>
              </div>
            </div>

            <div className="mt-[10.5px]">
              <div className="flex flex-wrap gap-[8px]">
                {tasks.map((task: Task, index: number) => (
                  <div
                    key={index}
                    style={{ backgroundColor: t.background_3 }}
                    className="py-[4px] px-[12px] text-[12px] rounded-full"
                  >
                    <div className="opacity-[0.6]">{task.task_id}</div>
                  </div>
                ))}
                <div
                  className="cursor-pointer hover:brightness-90 dim w-[25px] h-[25px] rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: t.background_3,
                  }}
                >
                  <FaPlus size={12} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <ScheduleTimeline
          start={startDate}
          end={endDate}
          onChange={(s, e) => {
            setStartDate(s);
            setEndDate(e);
          }}
        />
      </div>

      {/* bottom: tasks list */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Tasks</div>
          <div className="flex items-center gap-2">
            <div className="text-xs opacity-80">{tasks.length} tasks</div>
            <button
              onClick={() => setTasksCollapsed((p) => !p)}
              className="px-2 py-1 rounded text-xs"
            >
              {tasksCollapsed ? "Expand" : "Collapse"}
            </button>
            <button
              onClick={addTask}
              className="flex items-center gap-2 px-3 py-1 rounded bg-[rgba(255,255,255,0.03)] text-sm"
            >
              <Plus size={14} /> Add Task
            </button>
          </div>
        </div>

        <div
          className={`flex flex-col gap-3 ${
            tasksCollapsed ? "max-h-[120px] overflow-hidden" : ""
          }`}
        >
          {tasks.map((t, i) => (
            <TaskCard key={t.task_id ?? i} task={t} idx={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductJobCard2;
