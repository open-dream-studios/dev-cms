// project/src/screens/Dashboard/Dashboard.tsx
import { AuthContext } from "@/contexts/authContext";
import { useProjectContext } from "@/contexts/projectContext";
import React, { useContext } from "react";

const Dashboard = () => {
  const { currentUser } = useContext(AuthContext);

  if (!currentUser) return null;
  return <div className="w-[100%] h-[100%]">Dashboard</div>;
};

export default Dashboard;
