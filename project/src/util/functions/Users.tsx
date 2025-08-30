import { ProjectUser } from "@/types/project";
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

const roleLevels: Record<string, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
  owner: 4,
};

export function getUserAccess(
  currentProjectId: number,
  projectUsers: ProjectUser[],
  currentUserEmail?: string
): number {
  if (!currentProjectId || !currentUserEmail) return 0;
  const membership = projectUsers.find(
    (u) =>
      u.project_idx === currentProjectId &&
      u.email.toLowerCase() === currentUserEmail.toLowerCase()
  );

  if (!membership) return 0;

  return roleLevels[membership.role] ?? 0;
}
