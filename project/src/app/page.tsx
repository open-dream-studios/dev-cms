// project/src/app/page.tsx
"use client";
import React from "react";
import InventoryGrid from "@/screens/Inventory/InventoryGrid";
import { useAppContext } from "@/contexts/appContext";

const HomePage = () => {
  const { currentProject } = useAppContext();
  console.log(currentProject);
  return <InventoryGrid />;
};

export default HomePage;
