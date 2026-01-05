// project/src/contexts/routeScopeContext.tsx
"use client";

import { createContext, ReactNode, useContext } from "react";

export type RouteScope = "public" | "private";

const RouteScopeContext = createContext<RouteScope>("private");

export const RouteScopeProvider = ({
  scope,
  children,
}: {
  scope: RouteScope;
  children: ReactNode;
}) => {
  return (
    <RouteScopeContext.Provider value={scope}>
      {children}
    </RouteScopeContext.Provider>
  );
};

export const useRouteScope = () => useContext(RouteScopeContext);