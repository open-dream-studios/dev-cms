// project/src/modules/components/Calendar/Calendar.tsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
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
import { getInnerCardStyle } from "@/styles/themeStyles";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./Calendar.css";
import { JobDefinition } from "@/types/jobs";
import { UseFormReturn } from "react-hook-form";
import { JobFormData } from "@/util/schemas/jobSchema";

// ---------- ScheduleTimeline ----------
type ScheduleTimelineProps = {
  form: UseFormReturn<JobFormData> | null;
  matchedDefinition: JobDefinition;
};

export const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({
  form,
  matchedDefinition,
}) => {
  const { currentUser } = React.useContext(AuthContext);
  const theme = currentUser?.theme ?? "dark";
  const t = appTheme[theme];

  if (!form) return null;

  const DAY_START_HOUR = 7;
  const DAY_END_HOUR = 22;
  const HOURS = DAY_END_HOUR - DAY_START_HOUR;
  const BUFFER_DAYS = 1500; // => ~4 years forward/back (adjust if desired)
  const CENTER_INDEX = Math.floor(BUFFER_DAYS / 2); // index for "today" week center
  const SNAP_DEBOUNCE = 80; // ms

  const [isMini, setIsMini] = useState<boolean>(true);
  // const [localStart, setLocalStart] = useState<Date | null>(start ?? null);
  // const [localEnd, setLocalEnd] = useState<Date | null>(end ?? null);
  // useEffect(() => setLocalStart(start ?? null), [start]);
  // useEffect(() => setLocalEnd(end ?? null), [end]);

const scheduled_start_date_raw = form.watch("scheduled_start_date");
const completed_date_raw = form.watch("completed_date");

const scheduled_start_date = scheduled_start_date_raw
  ? new Date(scheduled_start_date_raw)
  : null;

const completed_date = completed_date_raw
  ? new Date(completed_date_raw)
  : null;

const effectiveStart = scheduled_start_date ?? new Date();
const effectiveEnd =
  completed_date ?? new Date((scheduled_start_date ?? new Date()).getTime() + 4 * 60 * 60 * 1000);

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
      snapToNearestDay();
    });
    resizeObserverRef.current.observe(scrollerRef.current);
    return () => {
      resizeObserverRef.current?.disconnect();
    };
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
  }, []);

  // "Schedule" button -> go to week of job start
  const handleGotoScheduleWeek = useCallback(() => {
    if (!scheduled_start_date) {
      // go to today week
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sunday = new Date(today);
      sunday.setDate(sunday.getDate() - sunday.getDay());
      scrollToWeekContainingIndex(dateToIndex(sunday));
      return;
    }
    const sunday = new Date(scheduled_start_date);
    sunday.setHours(0, 0, 0, 0);
    sunday.setDate(sunday.getDate() - sunday.getDay());
    scrollToWeekContainingIndex(dateToIndex(sunday));
  }, [scheduled_start_date, dateToIndex, scrollToWeekContainingIndex]);

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

  const handlePrevWeek = () => {
    if (!scrollerRef.current || !columnWidthRef.current) return;
    const currentIndex = Math.round(
      scrollerRef.current.scrollLeft / columnWidthRef.current
    );
    const currentDate = indexToDate(currentIndex);
    const sunday = new Date(currentDate);
    sunday.setHours(0, 0, 0, 0);
    sunday.setDate(sunday.getDate() - sunday.getDay());
    sunday.setDate(sunday.getDate() - 7);

    const sundayIndex = dateToIndex(sunday);
    scrollToWeekContainingIndex(sundayIndex, "smooth");
  };

  const handleNextWeek = () => {
    if (!scrollerRef.current || !columnWidthRef.current) return;
    const currentIndex = Math.round(
      scrollerRef.current.scrollLeft / columnWidthRef.current
    );
    const currentDate = indexToDate(currentIndex);
    const sunday = new Date(currentDate);
    sunday.setHours(0, 0, 0, 0);
    sunday.setDate(sunday.getDate() - sunday.getDay());
    sunday.setDate(sunday.getDate() + 7);
    const sundayIndex = dateToIndex(sunday);
    scrollToWeekContainingIndex(sundayIndex, "smooth");
  };

  const applyChange = (sN: Date | null, eN: Date | null) => {
    form.setValue("scheduled_start_date", sN);
    form.setValue("completed_date", eN);
  };

  const timelineHeight = isMini ? 160 : HOURS * 40;
  const headerHeight = 34;
  const gridHeight = Math.max(48, timelineHeight - headerHeight);

  return (
    <motion.div
      initial={false}
      className={`ScheduleTimeline w-full rounded-xl px-[14px] py-[9px] bg-opacity-80`}
      style={
        {
          ...getInnerCardStyle?.(theme, t),
          "--time-icon-filter":
            theme === "dark"
              ? "invert(100%)" // white clock icon in dark mode
              : "invert(0%)", // black clock icon in light mode
          "--date-icon-filter":
            theme === "dark"
              ? "invert(100%)" // white calendar icon in dark mode
              : "invert(0%)", // black calendar icon in light mode
        } as React.CSSProperties
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleGotoScheduleWeek}
            className="cursor-pointer hover:brightness-[85%] dim flex items-center gap-2 px-2 py-1 rounded-md hover:opacity-90 active:scale-95"
            style={{
              background: "linear-gradient(180deg,#0ea5a4,#2563eb)",
              color: "white",
              boxShadow: "0 3px 8px rgba(2,6,23,0.35)",
            }}
          >
            <Calendar size={14} />
            <span className="text-xs font-medium">Schedule</span>
          </button>

          <button
            onClick={() => setIsMini((prev) => !prev)}
            className="cursor-pointer hover:brightness-75 dim ml-1 px-2 py-1 rounded-md border border-gray-600"
            title={isMini ? "Expand" : "Collapse"}
          >
            {isMini ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
        </div>

        {/* Date/Time controls */}
        <div
          className="flex items-center gap-2 bg-opacity-60 rounded-[10px] px-[13px] py-[4.5px]"
          style={{
            background:
              theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)",
          }}
        >
          <div className="flex items-center gap-[6px]">
            <div className="text-[11px] opacity-80 mr-[4px]">Start</div>
            <div className="w-[100px] relative">
              <DatePicker
                selected={scheduled_start_date}
                onChange={(date) => applyChange(date, completed_date ?? null)}
                className={`w-full outline-none rounded-md px-2 py-1 text-[13px] ${
                  theme === "dark"
                    ? "text-white border-[#3d3d3d] border-[1px]"
                    : "text-black border-[#111] border-[0.5px]"
                }`}
                calendarClassName={
                  theme === "dark" ? "datepicker-dark" : "datepicker-light"
                }
                popperClassName={
                  theme === "dark" ? "datepicker-dark" : "datepicker-light"
                }
              />
            </div>

            <div className="w-[100px] relative">
              <DatePicker
                selected={scheduled_start_date}
                onChange={(date: Date | null) => {
                  if (!date) return; // ignore null
                  applyChange(date, completed_date ?? null);
                }}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="hh:mm aa"
                className={`w-full outline-none rounded-md px-2 py-1 text-[13px] ${
                  theme === "dark"
                    ? "text-white border-[#3d3d3d] border-[1px]"
                    : "text-black border-[#111] border-[0.5px]"
                }`}
                calendarClassName={
                  theme === "dark" ? "datepicker-dark" : "datepicker-light"
                }
                popperClassName={
                  theme === "dark" ? "datepicker-dark" : "datepicker-light"
                }
              />
            </div>
          </div>

          <div className="h-6 w-px bg-gray-700 mx-2" />

          <div className="flex items-center gap-[6px]">
            <div className="text-[11px] opacity-80 mr-[4px]">End</div>
            <div className="w-[100px] relative">
              <DatePicker
                selected={completed_date}
                onChange={(date) => applyChange(scheduled_start_date ?? null, date)}
                className={`w-full outline-none rounded-md px-2 py-1 text-[13px] ${
                  theme === "dark"
                    ? "text-white border-[#3d3d3d] border-[1px]"
                    : "text-black border-[#111] border-[0.5px]"
                }`}
                calendarClassName={
                  theme === "dark" ? "datepicker-dark" : "datepicker-light"
                }
                popperClassName={
                  theme === "dark" ? "datepicker-dark" : "datepicker-light"
                }
              />
            </div>
            <div className="w-[100px] relative">
              <DatePicker
                selected={completed_date}
                onChange={(date: Date | null) => {
                  if (!date) return;
                  applyChange(scheduled_start_date ?? null, date);
                }}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="hh:mm aa"
                className={`w-full outline-none rounded-md px-2 py-1 text-[13px] ${
                  theme === "dark"
                    ? "text-white border-[#3d3d3d] border-[1px]"
                    : "text-black border-[#111] border-[0.5px]"
                }`}
                calendarClassName={
                  theme === "dark" ? "datepicker-dark" : "datepicker-light"
                }
                popperClassName={
                  theme === "dark" ? "datepicker-dark" : "datepicker-light"
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Calendar area */}
      <div
        className="w-full overflow-hidden rounded-md pb-[16px] mt-[9px]"
        style={{ border: "1px solid rgba(255,255,255,0.03)" }}
      >
        <div className="flex">
          {/* Time labels column */}
          <div
            className={`relative ${
              isMini ? "text-[10px]" : "text-[11px]"
            } opacity-70 mt-[-9px] border-r-gray-700 border-r-[0.5px]`}
            style={{ minWidth: 50 }}
          >
            {/* spacer to match the date header height so everything lines up */}
            <div style={{ height: `${headerHeight}px` }} />

            {/* labels container (absolute labels placed at the exact same percentage positions as the grid lines) */}
            <div style={{ height: `${gridHeight}px`, position: "relative" }}>
              {Array.from({ length: HOURS + 1 }).map((_, h) => {
                const hour = DAY_START_HOUR + h;
                if (isMini && ![7, 10, 13, 16, 19, 22].includes(hour))
                  return null;
                const topPct = (h / HOURS) * 100;
                const hourLabel = ((DAY_START_HOUR + h + 11) % 12) + 1;
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
            className={`flex-1 overflow-x-auto overflow-y-hidden touch-pan-x hide-scrollbar smooth-scroll`}
            style={{
              WebkitOverflowScrolling: "touch",
              scrollSnapType: "x mandatory",
            }}
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
                className="flex items-center ml-[1px] border-b-gray-700 border-b-[0.5px]"
                style={{ height: `${headerHeight - 5}`, zIndex: 20 }}
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
                      <div className="text-center font-semibold text-[11px] leading-[13px]">
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
                      {Array.from({ length: HOURS + 1 }).map((_, h) => {
                        const hour = DAY_START_HOUR + h;
                        if (isMini && ![7, 10, 13, 16, 19, 22].includes(hour))
                          return null;
                        return (
                          <div
                            key={h}
                            className="absolute left-0 right-0 border-t border-gray-800"
                            style={{ top: `${(h / HOURS) * 100}%` }}
                          />
                        );
                      })}

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
                            <div className="text-[12px] font-semibold">{`${matchedDefinition.type} Job`}</div>
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

      <div className="mt-2 text-xs opacity-70 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="cursor-pointer hover:brightness-75 dim px-2 py-1 rounded-md bg-white/4"
            title="Prev week"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="text-sm opacity-80 px-2">
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
            className="cursor-pointer hover:brightness-75 dim px-2 py-1 rounded-md bg-white/4"
            title="Next week"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ScheduleTimeline;
