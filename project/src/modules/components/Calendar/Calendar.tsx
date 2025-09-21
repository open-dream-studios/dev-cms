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
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { appTheme } from "@/util/appTheme";
import { AuthContext } from "@/contexts/authContext";
import { getInnerCardStyle } from "@/styles/themeStyles";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./Calendar.css";
import { JobDefinition } from "@/types/jobs";
import { UseFormReturn, useWatch } from "react-hook-form";
import { JobFormData } from "@/util/schemas/jobSchema";
import { useLeftBarOpenStore } from "@/store/useLeftBarOpenStore";

// ---------- ScheduleTimeline ----------
type ScheduleTimelineProps = {
  form: UseFormReturn<JobFormData> | null;
  matchedDefinition: JobDefinition;
  cancelTimer: () => void;
  callSubmitForm: () => void;
  calendarContainerRef: React.RefObject<HTMLDivElement | null>;
};

export const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({
  form,
  matchedDefinition,
  cancelTimer,
  callSubmitForm,
  calendarContainerRef,
}) => {
  const { currentUser } = React.useContext(AuthContext);
  const theme = currentUser?.theme ?? "dark";
  const t = appTheme[theme];
  const leftBarOpen = useLeftBarOpenStore((state: any) => state.leftBarOpen);

  if (!form) return null;

  const DAY_START_HOUR = 7;
  const DAY_END_HOUR = 22;
  const HOURS = DAY_END_HOUR - DAY_START_HOUR;
  const BUFFER_DAYS = 1500; // => ~4 years forward/back (adjust if desired)
  const CENTER_INDEX = Math.floor(BUFFER_DAYS / 2); // index for "today" week center
  const SNAP_DEBOUNCE = 80; // ms

  const [isMini, setIsMini] = useState<boolean>(true);
  const [calendarCollapsed, setCalendarCollapsed] = useState<boolean>(false);

  const scheduled_start_date_raw = useWatch({
    control: form.control,
    name: "scheduled_start_date",
  });
  const completed_date_raw = useWatch({
    control: form.control,
    name: "completed_date",
  });

  const scheduled_start_date = scheduled_start_date_raw
    ? new Date(scheduled_start_date_raw)
    : null;

  const completed_date = completed_date_raw
    ? new Date(completed_date_raw)
    : null;

  const effectiveStart = scheduled_start_date ?? new Date();
  const effectiveEnd =
    completed_date ??
    new Date(
      (scheduled_start_date ?? new Date()).getTime() + 4 * 60 * 60 * 1000
    );

  // weekOffset concept preserved but we compute central index instead
  const [weekCenteredIndex, setWeekCenteredIndex] = useState<number>(() => {
    // calculate index for the week containing effectiveStart (centered in buffer)
    return CENTER_INDEX + weekIndexOffsetForDate(effectiveStart);
  });

  // --- refs ---
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const daysTrackRef = useRef<HTMLDivElement | null>(null);
  const columnWidthRef = useRef<number>(90);
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
  const [columnWidth, setColumnWidth] = useState<number>(90);
  const [columnAreaWidth, setColumnAreaWidth] = useState<number>(300);
  // const recalcColumnSizing = useCallback(() => {
  //   const container = scrollerRef.current;
  //   const daysTrack = daysTrackRef.current;
  //   if (!container || !daysTrack) return;
  //   // const w = container.clientWidth;
  //   // containerWidthRef.current = w;
  //   // const col = Math.max(50, Math.floor(w / 7)); // enforce min width for readability
  //   // columnWidthRef.current = col;
  //   // setColumnWidth(col);
  //   // daysTrack.style.width = `${col * daysCount}px`;

  //   if (calendarContainerRef.current) {
  //     // const rect = calendarContainerRef.current.getBoundingClientRect();
  //     // const columnsAreaWidth = rect.width - 4 - 28 - 50;
  //     // console.log(columnsAreaWidth);
  //     // setColumnAreaWidth(columnsAreaWidth);
  //     // const col = columnsAreaWidth / 7;
  //     // setColumnWidth(col);
  //     // console.log(col)
  //     // columnWidthRef.current = col;
  //     // console.log("ref", columnWidthRef.current)
  //     // daysTrack.style.width = `${col * daysCount}px`;
  //   }
  // }, [daysCount]);

  const recalcColumnSizing = useCallback(() => {
    const container = scrollerRef.current;
    const daysTrack = daysTrackRef.current;
    if (!container || !daysTrack) return;

    const w = container.clientWidth;
    containerWidthRef.current = w;

    // divide width by 7 columns
    const col = Math.max(50, Math.floor(w / 7));
    columnWidthRef.current = col;
    setColumnWidth(col);

    daysTrack.style.width = `${col * daysCount}px`;
  }, [daysCount]);

  // // setup ResizeObserver to update column sizing
  // useLayoutEffect(() => {
  //   recalcColumnSizing();
  //   if (!scrollerRef.current) return;
  //   resizeObserverRef.current = new ResizeObserver(() => {
  //     recalcColumnSizing();
  //     snapToNearestDay();
  //   });
  //   resizeObserverRef.current.observe(scrollerRef.current);
  //   return () => {
  //     resizeObserverRef.current?.disconnect();
  //   };
  // }, [recalcColumnSizing]);

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
  const prevCollapsedRef = useRef<boolean>(calendarCollapsed);
  const prevStartDateRef = useRef<number | null>(null);

  useEffect(() => {
    const justExpanded = prevCollapsedRef.current && !calendarCollapsed;
    prevCollapsedRef.current = calendarCollapsed;

    if (!scheduled_start_date) return;

    const ts = scheduled_start_date.getTime();
    const startDateChanged = prevStartDateRef.current !== ts;
    prevStartDateRef.current = ts;

    // Only scroll if:
    //   - we just expanded, OR
    //   - the start date actually changed
    if (!justExpanded && !startDateChanged) return;

    const sunday = new Date(scheduled_start_date);
    console.log("SUNDAY", sunday)
    sunday.setHours(0, 0, 0, 0);
    sunday.setDate(sunday.getDate() - sunday.getDay());

    const sundayIndex = dateToIndex(sunday);

    setTimeout(() => {
      scrollToWeekContainingIndex(sundayIndex, "auto");
    }, 30);
  }, [
    scheduled_start_date,
    calendarCollapsed,
    dateToIndex,
    scrollToWeekContainingIndex,
  ]);

  // "Schedule" button -> go to week of job start
  const handleGotoScheduleWeek = useCallback(() => {
    setCalendarCollapsed(false);
    if (!scheduled_start_date) {
      // go to today week
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sunday = new Date(today);
      sunday.setDate(sunday.getDate() - sunday.getDay());
      // scrollToWeekContainingIndex(dateToIndex(sunday));
      const sundayIndex = dateToIndex(sunday);
      scrollToWeekContainingIndex(sundayIndex);
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

  // useLayoutEffect(() => {
  //   const handleResize = () => {
  //     recalcColumnSizing();
  //     snapToNearestDay();
  //   };
  //   window.addEventListener("resize", handleResize);
  //   handleResize();

  //   return () => window.removeEventListener("resize", handleResize);
  // }, [recalcColumnSizing, snapToNearestDay]);

  useLayoutEffect(() => {
    if (!calendarContainerRef.current) return;
    const obs = new ResizeObserver(() => {
      recalcColumnSizing();
      snapToNearestDay();
    });
    obs.observe(calendarContainerRef.current);
    return () => obs.disconnect();
  }, [recalcColumnSizing, snapToNearestDay]);

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

  const applyChange = async (sN: Date | null, eN: Date | null) => {
    form.setValue("scheduled_start_date", sN);
    form.setValue("completed_date", eN);
    cancelTimer();
    await callSubmitForm();
  };

  const timelineHeight = isMini ? 160 : HOURS * 40;
  const headerHeight = 34;
  const gridHeight = Math.max(48, timelineHeight - headerHeight);

  // --- virtualization state ---
  const WEEKS_BEFORE = 8;
  const WEEKS_AFTER = 8;
  const DAYS_PER_WEEK = 7;

  const [anchorDate, setAnchorDate] = useState<Date>(() => {
    const base = scheduled_start_date ?? new Date();
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() - base.getDay()); // align to Sunday
    return base;
  });

  // store the currently visible window of weeks
  const [windowStart, setWindowStart] = useState<Date>(() => {
    const d = new Date(anchorDate);
    d.setDate(d.getDate() - WEEKS_BEFORE * DAYS_PER_WEEK);
    return d;
  });
  const [windowEnd, setWindowEnd] = useState<Date>(() => {
    const d = new Date(anchorDate);
    d.setDate(d.getDate() + WEEKS_AFTER * DAYS_PER_WEEK);
    return d;
  });

  // utility: generate days between start and end
  function generateDays(start: Date, end: Date): Date[] {
    const days: Date[] = [];
    const d = new Date(start);
    while (d <= end) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return days;
  }

  const visibleDays = useMemo(
    () => generateDays(windowStart, windowEnd),
    [windowStart, windowEnd]
  );

  // --- extend window when scrolling near edges ---
  const handleScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !columnWidthRef.current) return;

    const scrollLeft = scroller.scrollLeft;
    const currentIndex = Math.floor(scrollLeft / columnWidthRef.current);

    const currentDate = new Date(windowStart);
    currentDate.setDate(currentDate.getDate() + currentIndex);

    // if user scrolls near the start, prepend more weeks
    if (currentDate < addDays(windowStart, 7)) {
      const newStart = addDays(windowStart, -WEEKS_BEFORE * DAYS_PER_WEEK);
      setWindowStart(newStart);
    }

    // if user scrolls near the end, append more weeks
    if (currentDate > addDays(windowEnd, -7)) {
      const newEnd = addDays(windowEnd, WEEKS_AFTER * DAYS_PER_WEEK);
      setWindowEnd(newEnd);
    }
  }, [windowStart, windowEnd]);

  function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  // attach scroll listener
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.addEventListener("scroll", handleScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

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
      <div
        className={`flex justify-between flex-col min-[900px]:flex-col min-[1010px]:flex-row ${
          leftBarOpen ? "min-[1024px]:flex-col min-[1250px]:flex-row" : ""
        } gap-3 ${!calendarCollapsed && "mb-2"}`}
      >
        <div className="flex items-start pt-[6px] pl-[2px] gap-2">
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
            onClick={() => {
              if (calendarCollapsed) {
                setCalendarCollapsed(false);
              } else {
                setIsMini((prev) => !prev);
              }
            }}
            className="cursor-pointer hover:brightness-75 dim ml-1 px-2 py-1 rounded-md border border-gray-600"
            title={isMini ? "Expand" : "Collapse"}
          >
            {isMini ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
        </div>

        <div
          className={`flex flex-col items-start min-[640px]:flex-row min-[640px]:items-center min-[870px]:items-start min-[870px]:flex-col min-[900px]:flex-row min-[900]:items-center ${
            leftBarOpen
              ? "min-[1024px]:flex-col min-[1024px]:items-start min-[1100px]:flex-row min-[1100px]:items-center"
              : ""
          } gap-2 bg-opacity-60 rounded-[10px] px-[13px] py-[4.5px]`}
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

          <div className="h-6 w-px bg-gray-700 mx-2 hidden min-[640px]:block min-[870px]:hidden min-[900px]:block min-[1024px]:hidden min-[1100px]:block" />

          <div className="flex items-center gap-[6px]">
            <div className="text-[11px] opacity-80 mr-[4px] max-[1100px]:w-[26px]">
              End
            </div>
            <div className="w-[100px] relative">
              <DatePicker
                selected={completed_date}
                onChange={(date) =>
                  applyChange(scheduled_start_date ?? null, date)
                }
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
        className={`${
          calendarCollapsed && "hidden"
        } w-full overflow-hidden rounded-md pb-[16px] mt-[9px]`}
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
                // width: `${
                //   (columnWidthRef.current ||
                //     Math.max(
                //       90,
                //       Math.floor((containerWidthRef.current || 700) / 7)
                //     )) * daysArray.length
                // }px`,
                width: `${columnAreaWidth}px`,
                // width: `${(columnWidthRef.current || 90) * daysCount}px`,
              }}
            >
              {/* Date header row (scrolls horizontally with columns) */}
              <div
                className="flex items-center"
                style={{ height: `${headerHeight - 5}`, zIndex: 20 }}
              >
                {visibleDays.map((d) => {
                  return (
                    <div
                      key={d.toISOString()}
                      className="flex-shrink-0 flex items-center justify-center border-r border-gray-700"
                      style={{
                        width: `${columnWidthRef.current || 90}px`,
                        padding: "6px 4px",
                      }}
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
                {visibleDays.map((d, idx) => {
                  const blk = blocksByIndex.get(
                    /* convert date to index */ dateToIndex(d)
                  );
                  return (
                    <div
                      key={d.toISOString()}
                      className="relative border-r border-gray-700 flex-shrink-0"
                      style={{
                        width: `${columnWidthRef.current || 90}px`,
                        height: `${gridHeight}px`,
                        scrollSnapAlign: "start",
                        padding: "0 8px",
                      }}
                    >
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
                        className="absolute left-0 right-0 border-t-[1px] border-gray-700"
                        style={{ bottom: 0 }}
                      />

                      <div
                        className="absolute left-0 right-0 border-t-[1px] border-gray-700"
                        style={{ top: 0 }}
                      />

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
                            <div className="text-[12px] font-semibold">{`Job`}</div>
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

      {!calendarCollapsed && (
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
                sundayStart.setDate(
                  sundayStart.getDate() - sundayStart.getDay()
                );
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
          <button
            onClick={() => setCalendarCollapsed((prev) => !prev)}
            className="cursor-pointer hover:brightness-75 dim px-2 py-1 rounded-md bg-white/4"
            title="Collapse"
          >
            {calendarCollapsed ? (
              <ChevronDown size={16} className="opacity-[0.7]" />
            ) : (
              <ChevronUp size={16} className="opacity-[0.7]" />
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ScheduleTimeline;
