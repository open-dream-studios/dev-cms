// project/src/app/page.tsx
"use client";
import React from "react";
import Dashboard from "@/screens/Dashboard/Dashboard";
import { useUI } from "@/contexts/uiContext";
import MediaManager from "@/screens/MediaManager/MediaManager";
import PagesEditor from "@/screens/PagesEditor/PagesEditor";
import CustomerCatalog from "@/screens/CustomerCatalog/CustomerCatalog";

const HomePage = () => {
  const { screen } = useUI();
  return (
    <div className="relative w-[100%] h-[100%]">
      {screen === "dashboard" && <Dashboard />}
      {screen === "media" && <MediaManager />}
      {screen === "pages" && <PagesEditor />}
      {screen === "customers" && <CustomerCatalog />}
    </div>
  );
};

export default HomePage;
