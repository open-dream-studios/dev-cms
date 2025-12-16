// project/src/contexts/authContext
"use client";
import { createContext, ReactNode } from "react";
import { makeRequest } from "../util/axios";
import { ThemeType } from "../util/appTheme";
import { useQuery, useQueryClient } from "@tanstack/react-query"; 
import { logout } from "@/util/auth";
import { useUiStore } from "@/store/useUIStore";

export interface User {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_img_src: string | null;
  theme: ThemeType;
  credits: string;
  auth_provider: string;
  created_at: string;
  admin?: number;
}

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
  const { setLeftBarOpen,  modal1, setModal1, modal2, setModal2 } = useUiStore();
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
        const res = await makeRequest.get("/api/auth/current-user");
        return res.data && Object.keys(res.data).length ? res.data : null;
      },
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 5,
      refetchOnMount: true,
    });
  const currentUser = currentUserData ?? null;

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
    }
    queryClient.clear();
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
