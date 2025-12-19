// project/src/context/queryContext/queries/useTheme.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { User as FirebaseUser } from "firebase/auth";
import { ThemeType } from "@/util/appTheme";
import { User } from "@/contexts/authContext";

export function useTheme(currentUser: User | null) {
  const queryClient = useQueryClient();
  const toggleThemeMutation = useMutation<
    void,
    Error,
    ThemeType,
    { previousUser: FirebaseUser | null }
  >({
    mutationFn: async (newTheme) => {
      await makeRequest.put("/api/auth/update-current-user", {
        theme: newTheme,
      });
    },
    onMutate: (newTheme) => {
      queryClient.cancelQueries({ queryKey: ["currentUser"] });
      const previousUser =
        queryClient.getQueryData<FirebaseUser | null>(["currentUser"]) ?? null;

      // Optimistically update UI
      queryClient.setQueryData(
        ["currentUser"],
        (oldData: FirebaseUser | null) =>
          oldData ? { ...oldData, theme: newTheme } : oldData
      );
      return { previousUser };
    },
    onError: (_, __, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(["currentUser"], context.previousUser);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });

  const handleThemeChange = () => {
    if (!currentUser) return null;
    const newTheme = currentUser.theme === "light" ? "dark" : "light";
    toggleThemeMutation.mutate(newTheme);
  };

  return {
    handleThemeChange,
  };
}
