// project/src/app/page.tsx
"use client";
import React from "react";
import Dashboard from "@/screens/Dashboard/Dashboard";
import { useUI } from "@/contexts/uiContext";
import MediaManager from "@/screens/MediaManager/MediaManager";
import InventoryGrid from "@/screens/Inventory/InventoryGrid";
import ProductsPage from "@/screens/Inventory/ProductsPage";

const HomePage = () => {
  const { screen } = useUI();
  return (
    <div className="relative w-[100%] h-[100%]">
      {screen === "dashboard" && <Dashboard />}
      {screen === "media" && <MediaManager />}
      {/* {screen === "products" && <ProductsPage />} */}
      {/* {screen === "products-table" && <InventoryGrid />} */}
    </div>
  );
};

export default HomePage;
