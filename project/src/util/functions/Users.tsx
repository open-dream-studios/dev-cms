import { accessLevels } from "@shared/types/models/project";
import { QueryClient } from "@tanstack/react-query";

export const handleUpdateUser = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ["currentUser"] });
  queryClient.invalidateQueries({ queryKey: ["currentUserBilling"] });
  queryClient.invalidateQueries({ queryKey: ["currentUserSubscription"] });
};

// OPTION 2: REFETCH -> USEFUL if still in stale time, data has not been queried yet, or needs immediate update (invalidated query gets put on queue, delayed until other queries are done)
// export const handleUpdateUser = async (queryClient: QueryClient) => {
//   try {
//     const updatedUser = await queryClient.fetchQuery({
//       queryKey: ["currentUser"],
//       queryFn: async () => {
//         const res = await makeRequest.get("/api/users/current");
//         return res.data;
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching updated user:", error);
//   }
// };

export function getRoleFromClearance(clearance: number) {
  const entries = Object.entries(accessLevels);
  entries.sort((a, b) => b[1] - a[1]);
  const match = entries.find(([_, level]) => clearance >= level);
  return match ? match[0] : "external";
}

export function getClearanceFromRole(role: string) {
  if (!role) return 0;
  const key = role.toLowerCase().trim();
  return accessLevels[key as keyof typeof accessLevels] ?? 0;
}