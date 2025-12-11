// project/src/modules/TimelineModule/useCallHistory.ts
import { useQuery } from "@tanstack/react-query";

export function useCallHistory(customerId: string | null) {
  return useQuery({
    queryKey: ["call-history", customerId],
    queryFn: async () => {
      if (!customerId) return [];
      const res = await fetch(`/api/customers/${customerId}/calls`);
      if (!res.ok) throw new Error("Failed to load call history");
      return res.json();
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5,
  });
}