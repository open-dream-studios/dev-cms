// project/src/app/page.tsx
"use client";
import React from "react";
import MediaManager from "@/modules/MediaModule/MediaManager";
import PagesEditor from "@/modules/PagesModule/PagesEditor";
import CustomerCatalog from "@/modules/CustomersModule/CustomerCatalog";
import EmployeeCatalog from "@/modules/EmployeesModule/EmployeeCatalog";
import { useUiStore } from "@/store/useUIStore";
import GoogleAdsDashboard from "@/modules/GoogleModule/GoogleAdsModule/GoogleAdsDashboard";
import GmailModule from "@/modules/GoogleModule/GmailModule/GmailModule";
import UpdatesCatalog from "@/modules/UpdatesModule/UpdatesCatalog";

const HomePage = () => {
  const { screen } = useUiStore();
  return (
    <div className="relative w-[100%] h-[100%]">
      {screen === "google-ads" && <GoogleAdsDashboard />}
      {screen === "media" && <MediaManager />}
      {screen === "pages" && <PagesEditor />}
      {screen === "customers" && <CustomerCatalog />}
      {screen === "employees" && <EmployeeCatalog />}
      {screen === "gmail" && <GmailModule />}
      {screen === "updates" && <UpdatesCatalog />}
    </div>
  );
};

export default HomePage;
