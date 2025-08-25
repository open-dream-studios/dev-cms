import { useAppContext } from "@/contexts/appContext";
import { AuthContext } from "@/contexts/authContext";
import React, { useContext } from "react";

const Dashboard = () => {
  const { currentProject } = useAppContext();
  const { currentUser } = useContext(AuthContext);

  if (!currentUser || !currentProject) return null;
  return (
    <div className="w-[100%] h-[100%]">
      <p>{currentProject.name}</p>
    </div>
  );
};

export default Dashboard;
