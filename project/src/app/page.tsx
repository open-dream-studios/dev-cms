// project/src/app/page.tsx
"use client";
import React from "react";
import MediaManager from "@/modules/MediaModule/MediaManager";
import PagesModule from "@/modules/PagesModule/PagesModule";
import CustomersModule from "@/modules/CustomersModule/CustomersModule";
import EmployeesModule from "@/modules/EmployeesModule/EmployeesModule";
import { useUiStore } from "@/store/useUIStore";
import GoogleAdsDashboard from "@/modules/GoogleModule/GoogleAdsModule/GoogleAdsDashboard";
import GmailModule from "@/modules/GoogleModule/GmailModule/GmailModule";
import UpdatesCatalog from "@/modules/UpdatesModule/UpdatesCatalog";
import DecisionGraphBuilder from "@/modules/EstimationModule/EstimationBuilder/DecisionGraphBuilder";
import EstimationLauncher from "@/modules/EstimationModule/EstimationRuntime/EstimationLaunch";
// import PricingAdminPage from "@/modules/EstimationModule/PricingAdmin/PricingAdminPage"; 
import PricingAdminPage from "@/modules/EstimationModule/PricingAdmin/PricingAdminPage";
import EstimationsAdmin from "@/modules/EstimationModule/EstimationsAdmin";

const HomePage = () => {
  const { screen } = useUiStore();
  return (
    <div className="relative w-[100%] h-[100%]">
      {screen === "google-ads" && <GoogleAdsDashboard />}
      {screen === "media" && <MediaManager />}
      {screen === "pages" && <PagesModule />}
      {screen === "customers" && <CustomersModule />}
      {screen === "employees" && <EmployeesModule />}
      {screen === "gmail" && <GmailModule />}
      {screen === "updates" && <UpdatesCatalog />}
      {screen === "estimations-builder" && <DecisionGraphBuilder />}
      {screen === "estimations" && <EstimationLauncher />}
      {screen === "estimations-pricing" && <EstimationsAdmin />}
      {screen === "estimations-calculation" && <EstimationsAdmin />}
    </div>
  );
};

export default HomePage;
