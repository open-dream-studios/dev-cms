// project/src/hooks/useAppInitialization.ts
"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { makeRequest } from "@/util/axios";
import { queryClient } from "@/lib/queryClient";

export function useAppInitialization({
  currentUser,
  isLoadingCurrentUserData,
}: {
  currentUser: any;
  isLoadingCurrentUserData: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const ranRef = useRef(false);

  useEffect(() => {
    const run = async () => {
      if (isLoadingCurrentUserData) return;
      if (!currentUser) return;
      if (ranRef.current) return;

      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      if (!token) return;

      ranRef.current = true;

      const res = await makeRequest.post("/auth/accept-invite", { token });

      if (res.data?.success) {
        router.replace(pathname);
        await queryClient.invalidateQueries({
          predicate: () => true,
        });
      }
    };

    run();
  }, [currentUser, isLoadingCurrentUserData, pathname, router]);
}
