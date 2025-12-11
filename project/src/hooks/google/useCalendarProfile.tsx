import { useQuery } from "@tanstack/react-query";
import { useContextQueries } from "@/contexts/queryContext/queryContext";

// reuses the same "GET_PROFILE_WITH_PHOTO" requestType as gmail module
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