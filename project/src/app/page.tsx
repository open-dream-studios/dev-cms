// project/src/app/page.tsx
"use client";
import React from "react"; 
import MediaManager from "@/modules/MediaModule/MediaManager";
import PagesEditor from "@/modules/PagesModule/PagesEditor";
import CustomerCatalog from "@/modules/CustomersModule/CustomerCatalog";
import EmployeeCatalog from "@/modules/EmployeesModule/EmployeeCatalog";
import { useUiStore } from "@/store/useUIStore"; 
import GoogleAdsDashboard from "@/modules/DashboardModule/GoogleAdsDashboard";

const HomePage = () => {
  const { screen } = useUiStore();
  return (
    <div className="relative w-[100%] h-[100%]">
      {screen === "dashboard" && <GoogleAdsDashboard />}
      {screen === "media" && <MediaManager />}
      {screen === "pages" && <PagesEditor />}
      {screen === "customers" && <CustomerCatalog />}
      {screen === "employees" && <EmployeeCatalog />}
    </div>
  );
};

export default HomePage;
