// project/src/contexts/authContext
"use client";
import { createContext, ReactNode } from "react";
import { makeRequest } from "../util/axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { logout } from "@/util/auth";
import { useUiStore } from "@/store/useUIStore";
import { User } from "@open-dream/shared";

interface AuthContextType {
  currentUser: User | null;
  handleLogout: () => void;
  isLoadingCurrentUserData: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  handleLogout: () => {},
  isLoadingCurrentUserData: false,
});

interface AuthContextProviderProps {
  children: ReactNode;
}

export const AuthContextProvider = ({ children }: AuthContextProviderProps) => {
  const queryClient = useQueryClient();
  const { setLeftBarOpen, modal1, setModal1, modal2, setModal2 } = useUiStore();
  // useEffect(() => {
  //   if (typeof window !== "undefined") {
  //     const storedUser = localStorage.getItem("user");
  //     if (
  //       storedUser &&
  //       storedUser !== "undefined" &&
  //       storedUser !== "null" &&
  //       JSON.parse(storedUser).id
  //     ) {
  //       queryClient.setQueryData(["currentUser"], JSON.parse(storedUser));
  //     }
  //   }
  // }, [queryClient]);

  const { data: currentUserData, isLoading: isLoadingCurrentUserData } =
    useQuery<User | null>({
      queryKey: ["currentUser"],
      queryFn: async () => {
        const res = await makeRequest.get("/auth/me");
        return res.data && res.data.user && Object.keys(res.data.user).length ? res.data.user : null;
      },
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 5,
      refetchOnMount: true,
    });
  const currentUser = currentUserData ?? null;

  const handleLogout = async () => {
    // if (typeof window !== "undefined") {
    //   localStorage.removeItem("user");
    //   localStorage.removeItem("accessToken");
    // }
    setModal1({
      ...modal1,
      open: false,
    });
    setModal2({
      ...modal2,
      open: false,
    });
    setLeftBarOpen(false);
    const success = await logout();
    if (success) {
      window.location.reload();
    }
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        handleLogout,
        isLoadingCurrentUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
