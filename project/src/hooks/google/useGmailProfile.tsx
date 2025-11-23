// project/src/hooks/google/useGmailProfile.ts
import { useQuery } from "@tanstack/react-query";
import { useContextQueries } from "@/contexts/queryContext/queryContext";

export function useGmailProfile() {
  const { runModule } = useContextQueries();

  return useQuery({
    queryKey: ["gmail-profile"],
    queryFn: async () => {
      const res = await runModule("google-gmail-module", {
        requestType: "GET_PROFILE_WITH_PHOTO",
      });
      return res?.data;
    },
    staleTime: 1000 * 60 * 60 * 12, // 12 hours
    gcTime: Infinity, // never remove from cache
  });
}
