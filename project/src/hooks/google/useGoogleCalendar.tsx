import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContextQueries } from "../../contexts/queryContext/queryContext";

export function useGoogleCalendar(calendarId: string, timeMin: string, timeMax: string) {
  const { runModule } = useContextQueries();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["calendar-range", calendarId, timeMin, timeMax],
    queryFn: async () => {
      // Fetch ALL events inside this time range.
      // We must loop Google pagination manually.
      const allEvents: any[] = [];
      let pageToken: string | null = null;

      do {
        const res = await runModule("google-calendar-module", {
          requestType: "LIST_EVENTS",
          calendarId,
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

      return allEvents;
    },
    staleTime: 1000 * 60 * 3,
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["calendar-range", calendarId] });

  return {
    events: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refresh,
  };
}