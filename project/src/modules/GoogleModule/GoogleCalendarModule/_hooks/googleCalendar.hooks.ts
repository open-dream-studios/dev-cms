// project/src/GoogleModule/GoogleCalendarModule/_hooks/googleCalendar.hooks.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContextQueries } from "../../../../contexts/queryContext/queryContext";
import {
  GoogleCalendarEventRaw,
  GoogleCalendarTarget,
} from "@open-dream/shared";
import { useGoogleCalendarUIStore } from "../_store/googleCalendar.store";

export function useGoogleCalendar(
  timeMin: string,
  timeMax: string,
  calendarTarget: GoogleCalendarTarget
) {
  const { runModule } = useContextQueries();
  const queryClient = useQueryClient();
  const { setCalendar1Events, setCalendar2Events } = useGoogleCalendarUIStore()

  const query = useQuery({
    queryKey: ["calendar-range", calendarTarget, timeMin, timeMax],
    queryFn: async () => {
      // Fetch ALL events inside this time range.
      // We must loop Google pagination manually.
      const allEvents: GoogleCalendarEventRaw[] = [];
      let pageToken: string | null = null;

      do {
        const res = await runModule("google-calendar-module", {
          requestType: "LIST_EVENTS",
          calendarTarget,
          pageToken,
          timeMin,
          timeMax,
          pageSize: 2500, // max google calendar allows
          singleEvents: true,
          orderBy: "startTime",
        });

        const events = res?.data?.events ?? [];
        allEvents.push(...events);

        pageToken = res?.data?.nextPageToken ?? null;
      } while (pageToken);
      // console.log(allEvents);

      if (calendarTarget === 1) {
        setCalendar1Events(allEvents);
      }
      if (calendarTarget === 2) {
        setCalendar2Events(allEvents);
      }
      return allEvents;
    },
    staleTime: 1000 * 60 * 3,
  });

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: ["calendar-range", calendarTarget],
      exact: false,
    });

  return {
    events: (query.data ?? []) as GoogleCalendarEventRaw[],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refresh,
  };
}

export function useCalendarProfile(calendarTarget: number) {
  const { runModule } = useContextQueries();
  return useQuery({
    queryKey: ["calendar-profile"],
    queryFn: async () => {
      const res = await runModule("google-calendar-module", {
        requestType: "GET_PROFILE_WITH_PHOTO",
        calendarTarget,
      });
      return res?.data;
    },
    staleTime: 1000 * 60 * 60 * 12,
    gcTime: Infinity,
  });
}
