// src/modules/UpdatesModule/UpdatesCatalog.tsx
import React, { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import UpdatesView from "./UpdatesView";
import { useCurrentDataStore } from "@/store/currentDataStore";

const UpdatesCatalog: React.FC = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId } = useCurrentDataStore();

  if (!currentUser || !currentProjectId) return null;

  return (
    <div className="flex w-full h-[100%]">
      <UpdatesView />
    </div>
  );
};

export default UpdatesCatalog;
