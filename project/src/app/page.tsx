// project/src/app/page.tsx
"use client";
import React from "react";
import Dashboard from "@/modules/DashboardModule/Dashboard";
import MediaManager from "@/modules/MediaModule/MediaManager";
import PagesEditor from "@/modules/PagesModule/PagesEditor";
import CustomerCatalog from "@/modules/CustomersModule/CustomerCatalog";
import EmployeeCatalog from "@/modules/EmployeesModule/EmployeeCatalog";
import { useUiStore } from "@/store/useUIStore";

const HomePage = () => {
  const { screen } = useUiStore();
  return (
    <div className="relative w-[100%] h-[100%]">
      {screen === "dashboard" && <Dashboard />}
      {screen === "media" && <MediaManager />}
      {screen === "pages" && <PagesEditor />}
      {screen === "customers" && <CustomerCatalog />}
      {screen === "employees" && <EmployeeCatalog />}
    </div>
  );
};

export default HomePage;
