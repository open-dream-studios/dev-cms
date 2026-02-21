// project/src/GoogleModule/GoogleCalendarModule/_hooks/googleCalendar.hooks.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContextQueries } from "../../../../contexts/queryContext/queryContext";
import { GoogleCalendarEventRaw } from "@open-dream/shared";

export function useGoogleCalendar(
  calendarId: string,
  timeMin: string,
  timeMax: string
) {
  const { runModule } = useContextQueries();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["calendar-range", calendarId, timeMin, timeMax],
    queryFn: async () => {
      // Fetch ALL events inside this time range.
      // We must loop Google pagination manually.
      const allEvents: GoogleCalendarEventRaw[] = [];
      let pageToken: string | null = null;

      do {
        const res = await runModule("google-calendar-module", {
          requestType: "LIST_EVENTS",
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
      // console.log(allEvents)
      return allEvents;
    },
    staleTime: 1000 * 60 * 3,
  });

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: ["calendar-range", calendarId],
      exact: false,
    });

  return {
    events: (query.data ?? []) as GoogleCalendarEventRaw[],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refresh,
  };
}

export function useCalendarProfile() {
  const { runModule } = useContextQueries();
  return useQuery({
    queryKey: ["calendar-profile"],
    queryFn: async () => {
      const res = await runModule("google-calendar-module", {
        requestType: "GET_PROFILE_WITH_PHOTO",
      });
      return res?.data;
    },
    staleTime: 1000 * 60 * 60 * 12,
    gcTime: Infinity,
  });
}
