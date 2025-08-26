// project/src/screens/Dashboard/Dashboard.tsx
import { AuthContext } from "@/contexts/authContext";
import { useProjectContext } from "@/contexts/projectContext";
import { makeRequest } from "@/util/axios";
import React, { useContext } from "react";

const Dashboard = () => {
  const { currentProject } = useProjectContext();
  const { currentUser } = useContext(AuthContext);

  if (!currentProject) return null;

  const handleAddKey = async () => {
    console.log("Adding key");
    await makeRequest.post("/api/integrations", {
      project_idx: currentProject.id,
      module: "wix",
      config: {
        secret: "wix-secret",
        apiKey: "wix-api-key",
      },
    });
  };

  if (!currentUser || !currentProject) return null;
  return (
    <div className="w-[100%] h-[100%]">
      <p onClick={handleAddKey}>{currentProject.name}</p>
    </div>
  );
};

export default Dashboard;
