// project/src/layouts/appLayout.tsx
"use client";
import { ReactNode, useContext, useEffect, useRef, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { AuthContext, AuthContextProvider } from "@/contexts/authContext";
import Navbar from "@/components/Navbar/Navbar";
import LeftBar from "@/components/LeftBar/LeftBar";
import Modals from "@/modals/Modals";
import { usePathname, useRouter } from "next/navigation";
import LandingNav from "@/screens/Landing/LandingNav/LandingNav";
import {
  QueryProvider,
  useContextQueries,
} from "@/contexts/queryContext/queryContext";
import CustomToast from "@/components/CustomToast";
import LandingPage from "@/screens/Landing/LandingPage/LandingPage";
import AdminHome from "@/screens/AdminHome/AdminHome";
import DynamicTitle from "@/components/DynamicTitle";
import CustomerCalls from "@/modules/CustomerCallsModule/CustomerCalls";
import {
  setCurrentProjectData,
  useCurrentDataStore,
} from "@/store/currentDataStore";
// import { useWebSocketManager } from "@/store/webSocketStore";
import {
  initializeEnvironment,
  resetUIStore,
  setScreenSize,
  useUiStore,
} from "@/store/useUIStore";
import { useRouting } from "@/hooks/useRouting";
import { PageLayout } from "./pageLayout";
import UploadModal from "@/components/Upload/Upload";
import { ContextMenu } from "@/components/ContextMenu";

export default function AppLayout({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContextProvider>
        <QueryProvider>
          <CustomToast />
          <DynamicTitle />
          <AppRoot>{children}</AppRoot>
        </QueryProvider>
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

  const { environmentInitialized } = useUiStore();

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
  }, [router, currentUser, isLoadingCurrentUserData, pathname]);

  useEffect(() => {
    if (!environmentInitialized) {
      initializeEnvironment(window.location.hostname);
    }
  }, [environmentInitialized]);
  if (!environmentInitialized) return null;

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
  const { updatingLock } = useUiStore();
  const { projectsData } = useContextQueries();
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId } = useCurrentDataStore();
  const router = useRouter();

  // Reset UI whenever the project changes
  useEffect(() => {
    resetUIStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProjectId]);

  // useWebSocketManager();
  useRouting();
  // useTesting();

  // AUTO SELECT PROJECT
  useEffect(() => {
    if (projectsData.length === 1) {
      setCurrentProjectData(projectsData[0]);
    }
  }, [projectsData, setCurrentProjectData]);

  useEffect(() => {
    if (!currentProjectId) {
      router.push("/");
    }
  }, [router, currentProjectId]);

  useEffect(() => {
    const onResize = () => setScreenSize(window.innerWidth, window.innerHeight);
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!currentUser) return;

  return (
    <div className="w-[100vw] display-height">
      <ContextMenu/>
      {updatingLock && (
        <div className="z-[999] absolute left-0 top-0 w-[100vw] display-height" />
      )}
      <Modals landing={false} />
      <UploadModal />
      <Navbar />
      {currentProjectId ? (
        <>
          <LeftBar />
          <PageLayout leftbar={true}>{children}</PageLayout>
        </>
      ) : (
        <PageLayout leftbar={false}>
          <AdminHome />
        </PageLayout>
      )}
    </div>
  );
};
