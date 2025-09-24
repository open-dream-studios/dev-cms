// project/src/layouts/appLayout.tsx
"use client";
import {
  ReactNode,
  RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { AuthContext, AuthContextProvider } from "@/contexts/authContext";
import { useAppContext, AppContextProvider } from "@/contexts/appContext";
import Navbar from "@/components/Navbar/Navbar";
import LeftBar from "@/components/LeftBar/LeftBar";
import { appTheme } from "@/util/appTheme";
import { io, Socket } from "socket.io-client";
import Modals from "@/modals/Modals";
import appDetails from "@/util/appDetails.json";
import { usePathname, useRouter } from "next/navigation";
import LandingNav from "@/screens/Landing/LandingNav/LandingNav";
import { useLeftBarOpenStore } from "@/store/useLeftBarOpenStore";
import {
  QueryProvider,
  useContextQueries,
} from "@/contexts/queryContext/queryContext";
import CustomToast from "@/components/CustomToast";
import { usePageLayoutRefStore } from "@/store/usePageLayoutStore";
import LandingPage from "@/screens/Landing/LandingPage/LandingPage";
import AdminHome from "@/screens/AdminHome/AdminHome";
import DynamicTitle from "@/components/DynamicTitle";
import { Product } from "@/types/products";
import {
  ProjectContextProvider,
  useProjectContext,
} from "@/contexts/projectContext";
import CustomerCalls from "@/modules/CustomerCallsModule/CustomerCalls";

export default function AppLayout({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContextProvider>
        <ProjectContextProvider>
          <QueryProvider>
            <AppContextProvider>
              <CustomToast />
              <DynamicTitle />
              <AppRoot>{children}</AppRoot>
            </AppContextProvider>
          </QueryProvider>
        </ProjectContextProvider>
      </AuthContextProvider>
    </QueryClientProvider>
  );
}

const AppRoot = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient);
  const { currentUser, isLoadingCurrentUserData } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();

  const setLeftBarOpen = useLeftBarOpenStore(
    (state: any) => state.setLeftBarOpen
  );
  useEffect(() => {
    const isDesktop = window.innerWidth > 1024;
    setLeftBarOpen(isDesktop);
  }, [setLeftBarOpen]);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["currentUser"] });
  }, []);

  useEffect(() => {
    queryClientRef.current = queryClient;
  }, [queryClient]);

  useEffect(() => {
    if (!isLoadingCurrentUserData && !currentUser && pathname !== "/") {
      router.push("/");
    }
  }, [currentUser, isLoadingCurrentUserData, pathname]);

  if (isLoadingCurrentUserData) return null;
  if (!currentUser && pathname !== "/") return null;

  return currentUser ? (
    <ProtectedLayout>
      {children}
      <CustomerCalls />
    </ProtectedLayout>
  ) : (
    <UnprotectedLayout />
  );
};

const UnprotectedLayout = () => {
  return (
    <>
      <Modals landing={true} />
      <LandingNav />
      <LandingPage />
    </>
  );
};

const ProtectedLayout = ({ children }: { children: ReactNode }) => {
  const { editingLock, setSelectedProducts, setEditMode, setLocalData } =
    useAppContext();
  const { productsData } = useContextQueries();
  const pathName = usePathname();
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId } = useProjectContext();

  useEffect(() => {
    setSelectedProducts([]);
    setEditMode(false);
    setLocalData(
      productsData.sort(
        (a: Product, b: Product) => (a.ordinal ?? 0) - (b.ordinal ?? 0)
      )
    );
  }, [setSelectedProducts, pathName]);

  // useEffect(() => {
  //   const handleResize = () => {
  //     console.log(window.innerWidth, "px");
  //   };
  //   handleResize();

  //   window.addEventListener("resize", handleResize);
  //   return () => {
  //     window.removeEventListener("resize", handleResize);
  //   };
  // }, []);

  if (!currentUser) return;

  if (!currentProjectId) {
    return (
      <div className="w-[100vw] display-height">
        <Modals landing={false} />
        <Navbar />
        <div
          style={
            {
              "--nav-height": `${appDetails.nav_height}px`,
              backgroundColor: appTheme[currentUser.theme].background_1,
              color: appTheme[currentUser.theme].text_1,
            } as React.CSSProperties
          }
          className={`absolute left-0  top-[var(--nav-height)] w-[100vw] flex h-[calc(100%-var(--nav-height))]`}
        >
          <div className="relative w-[100%] h-[100%]">
            <AdminHome />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[100vw] display-height">
      {editingLock && (
        <div className="z-[999] absolute left-0 top-0 w-[100vw] display-height" />
      )}
      <Modals landing={false} />
      <Navbar />
      <LeftBar />
      <PageLayout>{children}</PageLayout>
    </div>
  );
};

const PageLayout = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useContext(AuthContext);
  const leftBarOpen = useLeftBarOpenStore((state: any) => state.leftBarOpen);

  const pageLayoutRef = useRef<HTMLDivElement>(null);
  const setPageLayoutRef = usePageLayoutRefStore(
    (state) => state.setPageLayoutRef
  );

  useEffect(() => {
    setPageLayoutRef(pageLayoutRef as RefObject<HTMLDivElement>);
  }, [setPageLayoutRef, pageLayoutRef]);

  if (!currentUser) return null;

  return (
    <div
      ref={pageLayoutRef}
      style={
        {
          "--nav-height": `${appDetails.nav_height}px`,
          "--left-bar-width": appDetails.left_bar_width,
          backgroundColor: appTheme[currentUser.theme].background_1,
          color: appTheme[currentUser.theme].text_1,
        } as React.CSSProperties
      }
      className={`absolute left-0 ${
        leftBarOpen && "lg:left-[calc(var(--left-bar-width))]"
      } top-[var(--nav-height)] w-[100vw] ${
        leftBarOpen && "lg:w-[calc(100vw-(var(--left-bar-width)))]"
      } flex h-[calc(100%-var(--nav-height))]`}
    >
      <div className="relative w-[100%] h-[100%]">{children}</div>
    </div>
  );
};
