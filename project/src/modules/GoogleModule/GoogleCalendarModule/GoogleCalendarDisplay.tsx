// project/src/modules/GoogleModule/GoogleCalendarModule/GoogleCalendarDisplay.tsx
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
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { AuthContext } from "@/contexts/authContext";
import { getInnerCardStyle } from "@/styles/themeStyles";
import "react-datepicker/dist/react-datepicker.css";
import "../../components/Calendar/Calendar.css";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { useGoogleCalendar } from "@/modules/GoogleModule/GoogleCalendarModule/_hooks/googleCalendar.hooks";
import {
  dateToIndex,
  timeToPct,
  weekIndexOffsetForDate,
} from "./_helpers/googleCalendar.helpers";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import {
  approveAndCreateScheduleEvent,
  resetInputUI,
} from "@/modules/GoogleModule/GoogleCalendarModule/_actions/googleCalendar.actions";
import {
  CalendarEvent,
  GoogleCalendarEventRaw,
  ScheduleRequestInput,
} from "@open-dream/shared";
import { useCurrentDataStore } from "@/store/currentDataStore";
import GoogleCalendarFooter from "./GoogleCalendarFooter";
import { useGoogleCalendarUIStore } from "./_store/googleCalendar.store";
import clsx from "clsx";
import { openWindow } from "@/util/functions/Handlers";

export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 22;
export const HOURS = DAY_END_HOUR - DAY_START_HOUR;

export const BUFFER_DAYS = 1500; // => ~4 years forward/back (adjust if desired)
export const CENTER_INDEX = Math.floor(BUFFER_DAYS / 2); // index for "today" week center
export const SNAP_DEBOUNCE = 80; // ms

// ---------- GoogleCalendarDisplay ----------
export const GoogleCalendarDisplay = () => {
  const { currentUser } = React.useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const [isMini, setIsMini] = useState<boolean>(true);
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);

  const {
    newScheduleEventStart,
    newScheduleEventEnd,
    selectedCalendarEvent,
    setSelectedCalendarEvent,
    newEventDetails,
    setIsCreatingEvent,
    editingCalendarEvent,
    calendarCollapsed,
    setCalendarCollapsed,
  } = useGoogleCalendarUIStore();

  const handleCalendarItemClick = (event: CalendarEvent) => {
    setSelectedCalendarEvent(event);
    setIsCreatingEvent(false);
    resetInputUI(false);
  };

  const [rangeStart, setRangeStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [rangeEnd, setRangeEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    d.setHours(23, 59, 59, 999);
    return d;
  });

  const { events, isLoading, isFetching, refresh } = useGoogleCalendar(
    "primary",
    rangeStart.toISOString(),
    rangeEnd.toISOString()
  );

  const effectiveStart = useMemo(() => new Date(), []);
  const effectiveEnd = useMemo(
    () => new Date(new Date().getTime() + 4 * 60 * 60 * 1000),
    []
  );

  function loadMorePast() {
    setRangeStart((prev) => {
      const newStart = new Date(prev);
      newStart.setDate(newStart.getDate() - 7);
      return newStart;
    });
  }

  function loadMoreFuture() {
    setRangeEnd((prev) => {
      const newEnd = new Date(prev);
      newEnd.setDate(newEnd.getDate() + 7);
      return newEnd;
    });
  }

  useEffect(() => {
    if (!events || events.length === 0) return;

    const normalized: CalendarEvent[] = (
      events as GoogleCalendarEventRaw[]
    ).map((ev) => {
      const start = new Date(ev.start.dateTime || ev.start.date!);
      const end = new Date(ev.end.dateTime || ev.end.date!);

      return {
        id: ev.id,
        raw: ev,
        title: ev.summary || "(no title)",
        start,
        end,
        startIndex: dateToIndex(start),
        endIndex: dateToIndex(end),
        topPct: timeToPct(start),
        heightPct: timeToPct(end) - timeToPct(start),
      };
    });

    setGoogleEvents(normalized);
  }, [events]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !selectedCalendarEvent ||
        editingCalendarEvent ||
        target.closest("[data-calendar-event]") ||
        target.closest("[data-calendar-event-card]") ||
        target.closest("[data-modal-2-continue]") ||
        target.closest("[ data-edit-event-button]") ||
        target.closest("[data-delete-event-button]") ||
        target.closest("[data-calendar-create-button]")
      )
        return;
      setSelectedCalendarEvent(null);
    };
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [selectedCalendarEvent, setSelectedCalendarEvent, editingCalendarEvent]);

  // const dateStartString = useMemo(
  //   () => new Date(new Date().getTime() - 4 * 60 * 60 * 1000).toISOString(),
  //   []
  // );
  // const dateEndString = useMemo(
  //   () => new Date(new Date().getTime() + 4 * 60 * 60 * 1000).toISOString(),
  //   []
  // );
  // const { events, fetchNextPage, hasNextPage, isFetchingNextPage } =
  //   useGoogleCalendar("primary", 50, dateStartString, dateEndString);

  // const hasAutoPaginated = useRef(false);
  // const hasAutoLoaded = useRef(false);

  // useEffect(() => {
  //   if (!hasAutoPaginated.current && hasNextPage && !isFetchingNextPage) {
  //     hasAutoPaginated.current = true;
  //     fetchNextPage();
  //   }
  // }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // NORMALIZE EVENTS safely (only when events change)
  // useEffect(() => {
  //   if (!events || events.length === 0 || hasAutoLoaded.current) return;

  //   const normalized = events.map((ev: any) => {
  //     const start = new Date(ev.start.dateTime || ev.start.date);
  //     const end = new Date(ev.end.dateTime || ev.end.date);

  //     return {
  //       id: ev.id,
  //       title: ev.summary || "(no title)",
  //       colorId: ev.colorId,
  //       start,
  //       end,
  //       startIndex: dateToIndex(start),
  //       endIndex: dateToIndex(end),
  //       topPct: timeToPct(start),
  //       heightPct: timeToPct(end) - timeToPct(start),
  //     };
  //   });

  //   hasAutoLoaded.current = true;
  //   setGoogleEvents(normalized);
  // }, [events]);

  // weekOffset concept preserved but we compute central index instead
  const [weekCenteredIndex, setWeekCenteredIndex] = useState<number>(() => {
    // calculate index for the week containing effectiveStart (centered in buffer)
    return CENTER_INDEX + weekIndexOffsetForDate(effectiveStart);
  });

  // --- refs ---
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const daysTrackRef = useRef<HTMLDivElement | null>(null);
  const virtualTrackRef = useRef<HTMLDivElement | null>(null); // NEW: actual wide track
  const columnWidthRef = useRef<number>(0);
  const containerWidthRef = useRef<number>(0);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const snapTimeoutRef = useRef<number | null>(null);

  // --- virtualization state ---
  // how many real columns visible at once (suggest 7), but render more for buffer
  const VISIBLE_DAYS = 21; // number of days to consider visible (3 weeks) — tune if you want
  const SIDE_BUFFER = 14; // extra days before/after visible to render
  const [renderRange, setRenderRange] = useState<{
    start: number;
    end: number;
  }>(() => {
    const start = Math.max(
      0,
      CENTER_INDEX - Math.floor(VISIBLE_DAYS / 2) - SIDE_BUFFER
    );
    const end = Math.min(
      BUFFER_DAYS - 1,
      start + VISIBLE_DAYS + SIDE_BUFFER * 2 - 1
    );
    return { start, end };
  });

  // --- helper functions ---

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
    // set width of virtual track so each column uses this width
    if (virtualTrackRef.current) {
      virtualTrackRef.current.style.width = `${col * daysCount}px`;
    }
    // Note: keep the daysTrackRef outer wrapper width unchanged (you requested this line left alone)
    // daysTrackRef.current.style.width = `290px`; // KEEPING original placement below in JSX
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recalcColumnSizing]);

  // --- blocks calculation for visible week (we still compute blocks by index and read them from the map) ---
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
      // if (!scheduled_start_date) {
      //   map.set(i, null);
      // } else
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

  // --- virtualization: compute the slice of indices to render based on renderRange ---
  const renderedIndices = useMemo(() => {
    const arr: number[] = [];
    for (let i = renderRange.start; i <= renderRange.end; i++) arr.push(i);
    return arr;
  }, [renderRange]);

  // initial scroll position & schedule button behavior (unchanged)
  // const scrollToWeekContainingIndex = useCallback(
  //   (index: number, behavior: ScrollBehavior = "smooth") => {
  //     const scroller = scrollerRef.current;
  //     if (!scroller || !columnWidthRef.current) return;
  //     const dt = indexToDate(index);
  //     const sunday = new Date(dt);
  //     sunday.setHours(0, 0, 0, 0);
  //     sunday.setDate(sunday.getDate() - sunday.getDay());
  //     const sundayIndex = dateToIndex(sunday);
  //     const left = sundayIndex * columnWidthRef.current;
  //     scroller.scrollTo({ left: 63100, behavior });
  //     setWeekCenteredIndex(sundayIndex);
  //   },
  //   [indexToDate, dateToIndex]
  // );

  const scrollToWeekContainingIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const scroller = scrollerRef.current;
      if (!scroller || !columnWidthRef.current) return;

      const dt = indexToDate(index);
      const sunday = new Date(dt);
      sunday.setHours(0, 0, 0, 0);
      sunday.setDate(sunday.getDate() - sunday.getDay());
      const sundayIndex = dateToIndex(sunday);
      const left = sundayIndex * columnWidthRef.current;

      // ensure render range covers the target
      setRenderRange((prev) => {
        if (sundayIndex < prev.start || sundayIndex > prev.end) {
          return {
            start: Math.max(0, sundayIndex - SIDE_BUFFER),
            end: Math.min(
              BUFFER_DAYS - 1,
              sundayIndex + VISIBLE_DAYS + SIDE_BUFFER
            ),
          };
        }
        return prev;
      });

      requestAnimationFrame(() => {
        scroller.scrollTo({ left, behavior });
      });

      setWeekCenteredIndex(sundayIndex);
    },
    [indexToDate, dateToIndex]
  );

  const prevCollapsedRef = useRef<boolean>(calendarCollapsed);
  const prevStartDateRef = useRef<number | null>(null);

  const goToWeek = useCallback(() => {
    // if (!scheduled_start_date) return;

    // const sunday = new Date(scheduled_start_date);
    const sunday = new Date();
    sunday.setHours(0, 0, 0, 0);
    sunday.setDate(sunday.getDate() - sunday.getDay());

    const sundayIndex = dateToIndex(sunday);

    setTimeout(() => {
      scrollToWeekContainingIndex(sundayIndex, "auto");
    }, 1000);
  }, [dateToIndex, scrollToWeekContainingIndex]);

  const goToCurrentWeek = useCallback(() => {
    const sunday = new Date();
    sunday.setHours(0, 0, 0, 0);
    sunday.setDate(sunday.getDate() - sunday.getDay());
    const sundayIndex = dateToIndex(sunday);
    setTimeout(() => {
      scrollToWeekContainingIndex(sundayIndex, "auto");
    }, 1000);
  }, [
    // scheduled_start_date,
    dateToIndex,
    scrollToWeekContainingIndex,
  ]);

  useEffect(() => {
    const justExpanded = prevCollapsedRef.current && !calendarCollapsed;
    prevCollapsedRef.current = calendarCollapsed;
    // if (!scheduled_start_date) {
    goToCurrentWeek();
    return;
    // }

    // const ts = scheduled_start_date.getTime();
    // const startDateChanged = prevStartDateRef.current !== ts;
    // prevStartDateRef.current = ts;

    // if (!justExpanded && !startDateChanged) return;
    // goToWeek();
  }, [
    // scheduled_start_date,
    calendarCollapsed,
    dateToIndex,
    scrollToWeekContainingIndex,
  ]);

  // "Schedule" button -> go to week of job start
  const handleGotoScheduleWeek = useCallback(() => {
    setCalendarCollapsed(false);
    // if (!scheduled_start_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sunday = new Date(today);
    sunday.setDate(sunday.getDate() - sunday.getDay());
    scrollToWeekContainingIndex(dateToIndex(sunday));
    return;
    // }
    // const sunday = new Date(scheduled_start_date);
    // sunday.setHours(0, 0, 0, 0);
    // sunday.setDate(sunday.getDate() - sunday.getDay());
    // scrollToWeekContainingIndex(dateToIndex(sunday));
  }, [
    // scheduled_start_date,
    dateToIndex,
    scrollToWeekContainingIndex,
  ]);

  // Snap-to-day behavior (unchanged)
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

  // debounce wrapper for onScroll (we still keep snap behavior)
  // useEffect(() => {
  //   const scroller = scrollerRef.current;
  //   if (!scroller) return;
  //   const onScroll = () => {
  //     if (snapTimeoutRef.current) {
  //       window.clearTimeout(snapTimeoutRef.current);
  //     }
  //     snapTimeoutRef.current = window.setTimeout(() => {
  //       snapToNearestDay("smooth");
  //     }, SNAP_DEBOUNCE);
  //   };
  //   scroller.addEventListener("scroll", onScroll, { passive: true });
  //   return () => {
  //     scroller.removeEventListener("scroll", onScroll);
  //     if (snapTimeoutRef.current) {
  //       window.clearTimeout(snapTimeoutRef.current);
  //     }
  //   };
  // }, [snapToNearestDay]);

  // Update renderRange while scrolling — throttled with rAF
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let rafId: number | null = null;

    const onScroll = () => {
      if (rafId !== null) return; // simple throttle
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        const left = scroller.scrollLeft;
        const colW =
          columnWidthRef.current ||
          Math.max(90, Math.floor((containerWidthRef.current || 700) / 7));
        const firstVisibleIdx = Math.floor(left / colW);
        const visibleCenter =
          firstVisibleIdx +
          Math.ceil((containerWidthRef.current || colW * 7) / colW / 2);
        const newStart = Math.max(0, firstVisibleIdx - SIDE_BUFFER);
        const newEnd = Math.min(
          BUFFER_DAYS - 1,
          firstVisibleIdx + VISIBLE_DAYS + SIDE_BUFFER
        );
        // Only update if changed
        if (newStart !== renderRange.start || newEnd !== renderRange.end) {
          setRenderRange({ start: newStart, end: newEnd });
        }
        // setWeekCenteredIndex(visibleCenter - 4);
        if (snapTimeoutRef.current) {
          window.clearTimeout(snapTimeoutRef.current);
        }
        snapTimeoutRef.current = window.setTimeout(() => {
          const visibleCenter =
            firstVisibleIdx +
            Math.ceil((containerWidthRef.current || colW * 7) / colW / 2);
          setWeekCenteredIndex(visibleCenter - 4);
          snapTimeoutRef.current = null;
        }, SNAP_DEBOUNCE);
      });
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    // trigger initial update
    onScroll();
    return () => {
      scroller.removeEventListener("scroll", onScroll as EventListener);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderRange.start, renderRange.end, VISIBLE_DAYS]);

  const handlePrevWeek = () => {
    if (!scrollerRef.current || !columnWidthRef.current) return;
    const currentIndex = Math.floor(
      scrollerRef.current.scrollLeft / columnWidthRef.current
    );
    const firstVisibleDate = indexToDate(currentIndex);
    const currentWeekSunday = new Date(firstVisibleDate);
    currentWeekSunday.setHours(0, 0, 0, 0);
    currentWeekSunday.setDate(
      currentWeekSunday.getDate() - currentWeekSunday.getDay()
    );
    const targetSunday = new Date(currentWeekSunday);
    if (firstVisibleDate.getDay() === 0) {
      targetSunday.setDate(targetSunday.getDate() - 7);
    }
    const sundayIndex = dateToIndex(targetSunday);
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
    // if (!form) return;
    // form.setValue("scheduled_start_date", sN);
    // form.setValue("completed_date", eN);
    // cancelTimer();
    // await callSubmitForm();
  };

  const timelineHeight = isMini ? HOURS * 20 : HOURS * 40;
  const headerHeight = 28;
  const gridHeight = Math.max(48, timelineHeight - headerHeight);

  // compute human-readable label for the centered week (still uses weekCenteredIndex)
  const weekRangeLabel = useMemo(() => {
    const sunday = indexToDate(weekCenteredIndex);
    const sundayStart = new Date(sunday);
    sundayStart.setHours(0, 0, 0, 0);
    sundayStart.setDate(sundayStart.getDate() - sundayStart.getDay());
    const saturday = new Date(sundayStart);
    saturday.setDate(saturday.getDate() + 6);
    return `${sundayStart.toLocaleDateString()} – ${saturday.toLocaleDateString()}`;
  }, [weekCenteredIndex, indexToDate]);

  const movedToCorrectWeek = useRef<boolean>(false);
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || movedToCorrectWeek.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          // Wait one frame so layout is finalized
          movedToCorrectWeek.current = true;
          requestAnimationFrame(() => {
            // if (scheduled_start_date) goToWeek();
            // else
            goToCurrentWeek();
          });
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(scroller);
    return () => observer.disconnect();
  }, [
    // scheduled_start_date,
    goToWeek,
    goToCurrentWeek,
  ]);

  if (!currentUser) return null;

  return (
    <motion.div
      initial={false}
      className={`${
        calendarCollapsed && "cursor-pointer hover:brightness-80 dim"
      } GoogleCalendar w-[100%] rounded-xl px-[14px] py-[9px] bg-opacity-80`}
      onClick={() => {
        if (calendarCollapsed) {
          setCalendarCollapsed(false);
        }
      }}
      style={
        {
          ...getInnerCardStyle?.(currentUser.theme, currentTheme),
          "--time-icon-filter":
            currentUser.theme === "dark" ? "invert(100%)" : "invert(0%)",
          "--date-icon-filter":
            currentUser.theme === "dark" ? "invert(100%)" : "invert(0%)",
        } as React.CSSProperties
      }
    >
      {/* Header */}
      <div
        className={`${
          calendarCollapsed ? "mb-1" : "mb-3"
        } mt-[4px] pr-[2px] text-xs opacity-70 flex items-center justify-between gap-2`}
      >
        <div className="flex flex-row items-center gap-[8px]">
          <div
            onClick={() => {
              if (!calendarCollapsed) {
                openWindow("https://calendar.google.com/calendar/u/0/r");
              }
            }}
            className={`${
              !calendarCollapsed && "cursor-pointer hover:brightness-75 dim"
            } select-none mt-[-3px] h-[32px] relative flex flex-row gap-[9px]`}
          >
            <img
              className="w-[32px] h-[32px] brightness-110"
              src="https://dev-cms-project-media.s3.us-east-1.amazonaws.com/global/google-calendar.png"
            />
            <div className="mt-[0.5px] text-[24px] font-[100] leading-[30px]">
              <span className="font-[500]">Google</span> Calendar
            </div>
          </div>

          {!calendarCollapsed && (
            <div className="flex flex-row gap-[8px] ml-[7px]">
              <button
                onClick={handlePrevWeek}
                className="cursor-pointer opacity-[70%] hover:brightness-90 dim px-2 py-1 rounded-md bg-[#292929]"
                title="Last week"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="text-sm opacity-80 px-2">{weekRangeLabel}</div>

              <button
                onClick={handleNextWeek}
                className="cursor-pointer opacity-[70%] hover:brightness-90 dim px-2 py-1 rounded-md bg-[#292929]"
                title="Next week"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-row gap-[5px]">
          {!calendarCollapsed && (
            <button
              onClick={() => {
                setIsMini((prev) => !prev);
              }}
              className="cursor-pointer hover:brightness-75 dim px-2 py-1 rounded-md bg-[#292929]"
              title={isMini ? "Expand" : "Collapse"}
            >
              {isMini ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
            </button>
          )}
          <button
            onClick={() => {
              if (!calendarCollapsed) {
                setCalendarCollapsed(!calendarCollapsed);
              }
            }}
            className={`${
              !calendarCollapsed && "cursor-pointer hover:brightness-90 dim"
            } px-2 py-1 rounded-md bg-[#292929]`}
            title={calendarCollapsed ? "Expand" : "Collapse"}
            style={{
              transform: calendarCollapsed ? "rotate(270deg)" : "none",
            }}
          >
            {calendarCollapsed ? (
              <ChevronDown size={16} className="opacity-[0.7]" />
            ) : (
              <ChevronUp size={16} className="opacity-[0.7]" />
            )}
          </button>
        </div>
      </div>

      {/* Calendar area */}
      <div
        className={`${
          calendarCollapsed && "hidden"
        } w-[100%]] rounded-md pb-[16px] mt-[9px]`}
        style={{ border: "1px solid rgba(255,255,255,0.03)" }}
      >
        <div className="flex w-[100%]">
          <div
            className={`relative ${
              isMini ? "text-[10px]" : "text-[11px]"
            } opacity-70 mt-[-1px] border-r-gray-700 border-r-[0.5px]`}
            style={{ minWidth: 50 }}
          >
            <div style={{ height: `${headerHeight}px` }} />
            <div style={{ height: `${gridHeight}px`, position: "relative" }}>
              {Array.from({ length: HOURS + 1 }).map((_, h) => {
                const hour = DAY_START_HOUR + h;
                if (isMini && hour % 2 !== 0) {
                  return null;
                }
                // ![7, 10, 13, 16, 19, 22].includes(hour))

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
              // *** THIS LINE LEFT EXACTLY AS YOU REQUESTED ***
              style={{
                width: "290px",
              }}
            >
              {/* NEW inner virtual track that actually spans the full calendar width */}
              <div
                ref={virtualTrackRef}
                className="relative"
                style={{
                  height: `${headerHeight + gridHeight}px`,
                  // width will be set in recalcColumnSizing via ref
                }}
              >
                {/* Header row — we only render the visible slice, each absolutely positioned */}
                <div
                  className="flex  items-center ml-[1px] border-b-gray-700 border-b-[0.5px]"
                  style={{ zIndex: 20, position: "absolute", left: 0, top: 0 }}
                >
                  {renderedIndices.map((idx) => {
                    const d = daysArray[idx];
                    const colW =
                      columnWidthRef.current ||
                      Math.max(
                        90,
                        Math.floor((containerWidthRef.current || 700) / 7)
                      );
                    return (
                      <div
                        key={idx}
                        className="top-0 flex-shrink-0 flex items-center justify-center border-r border-b border-gray-700"
                        style={{
                          height: `${headerHeight}px`,
                          width: `${colW}px`,
                          padding: "6px 4px",
                          position: "absolute",
                          left: `${idx * colW}px`,
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

                {/* Grid area — each day column absolutely positioned */}
                <div
                  className="relative"
                  style={{
                    height: `${gridHeight}px`,
                    position: "absolute",
                    left: 0,
                    top: `${headerHeight}px`,
                    width: "100%",
                  }}
                >
                  {renderedIndices.map((idx) => {
                    const d = daysArray[idx];
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
                        className="relative border-l border-gray-700"
                        style={{
                          width: `${colW}px`,
                          height: `${gridHeight}px`,
                          position: "absolute",
                          left: `${idx * colW}px`,
                          scrollSnapAlign: "start",
                          padding: "0 8px",
                        }}
                      >
                        {/* {Array.from({ length: HOURS + 1 }).map((_, h) => {
                          const hour = DAY_START_HOUR + h;
                          if (isMini && hour % 2 !== 0) {
                            return null;
                          }
                          // if (isMini && ![7, 10, 13, 16, 19, 22].includes(hour))
                          return (
                            <div
                              key={h}
                              className="absolute left-0 right-0 border-t border-gray-800"
                              style={{ top: `${(h / HOURS) * 100}%` }}
                            />
                          );
                        })} */}

                        {Array.from({ length: HOURS + 1 }).map((_, h) => {
                          const hour = DAY_START_HOUR + h;

                          const topPct = (h / HOURS) * 100;

                          const isMajor = hour % 2 === 0;
                          return (
                            <div
                              key={h}
                              className="absolute left-0 right-0 border-t border-gray-700/50"
                              style={{
                                top: `${(h / HOURS) * 100}%`,
                                opacity: isMajor ? 1 : 0.4,
                              }}
                            />
                          );
                        })}

                        <div
                          className="absolute left-0 right-0 border-t border-gray-800"
                          style={{ bottom: 0 }}
                        />

                        {/* {blk && blk !== null && (
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
                              <div className="text-[12px] font-semibold opacity-[0.79]">{`Job`}</div>
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
                        )} */}

                        {googleEvents
                          .filter(
                            (ev) => idx >= ev.startIndex && idx <= ev.endIndex
                          )
                          .map((ev: CalendarEvent) => {
                            const isStartDay = idx === ev.startIndex;
                            const isEndDay = idx === ev.endIndex;

                            const top = isStartDay ? ev.topPct : 0;
                            const height = isEndDay ? ev.heightPct : 100 - top;

                            if (
                              editingCalendarEvent &&
                              editingCalendarEvent.id === ev.id
                            )
                              return null;

                            return (
                              <div
                                data-calendar-event
                                key={ev.id + "-" + idx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCalendarItemClick(ev);
                                }}
                                // className="mt-[1px] absolute rounded-[3px] text-[10px] px-1 pb-[2px] pt-[1.5px] text-white overflow-hidden cursor-pointer hover:brightness-84 dim"
                                className={clsx(
                                  "mt-[1px] absolute rounded-[3px] text-[10px] px-1 pb-[2px] pt-[1.5px] text-white overflow-hidden cursor-pointer transition dim hover:brightness-80",
                                  selectedCalendarEvent &&
                                    selectedCalendarEvent.id !== ev.id &&
                                    "brightness-40"
                                )}
                                style={{
                                  top: `${top}%`,
                                  height: `calc(${height}% - 1px)`,
                                  left: "0.5px",
                                  right: "0.5px",
                                  backgroundColor:
                                    currentTheme.google_calendar_event,
                                }}
                              >
                                {isStartDay && <div>{ev.title}</div>}
                              </div>
                            );
                          })}

                        {newScheduleEventStart &&
                          newScheduleEventEnd &&
                          (() => {
                            const day = daysArray[idx];

                            // Start/end of this day
                            const dayStart = new Date(day);
                            dayStart.setHours(DAY_START_HOUR, 0, 0, 0);
                            const dayEnd = new Date(day);
                            dayEnd.setHours(DAY_END_HOUR, 0, 0, 0);

                            // Overlap of the scheduled event with this day
                            const overlapStart = new Date(
                              Math.max(
                                newScheduleEventStart.getTime(),
                                dayStart.getTime()
                              )
                            );
                            const overlapEnd = new Date(
                              Math.min(
                                newScheduleEventEnd.getTime(),
                                dayEnd.getTime()
                              )
                            );

                            if (overlapEnd <= overlapStart) return null;

                            const topPct = timeToPct(overlapStart);
                            const heightPct = timeToPct(overlapEnd) - topPct;

                            return (
                              <div
                                key={"scheduled-" + idx}
                                className="mt-[1px] absolute rounded-[3px] text-[10px] px-1 pb-[2px] pt-[1.5px] text-white overflow-hidden cursor-pointer hover:brightness-[84%] dim"
                                style={{
                                  top: `${topPct}%`,
                                  height: `calc(${heightPct}% - 1px)`,
                                  left: "0.5px",
                                  right: "0.5px",
                                  backgroundColor:
                                    currentTheme.new_google_calendar_event,
                                }}
                              >
                                {/* Only show label on first day */}
                                {idx === dateToIndex(newScheduleEventStart) && (
                                  <div>
                                    {newEventDetails.title &&
                                    newEventDetails.title.trim().length > 0
                                      ? newEventDetails.title
                                      : "New Event"}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!calendarCollapsed && (
        <GoogleCalendarFooter
          refresh={refresh}
          setGoogleEvents={setGoogleEvents}
        />
      )}
    </motion.div>
  );
};

export default GoogleCalendarDisplay;
