// src/modules/UpdatesModule/UpdatesCatalog.tsx
import React, { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import UpdatesView from "./UpdatesView";
import ModuleLeftBar from "../components/ModuleLeftBar";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";

const UpdatesCatalog: React.FC = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId } = useCurrentDataStore();
  const { addingUpdate } = useUiStore();

  if (!currentUser || !currentProjectId) return null;

  return (
    <div className="flex w-full h-[100%]">
      <ModuleLeftBar />
      <div className="flex-1">
        <UpdatesView />
      </div>
    </div>
  );
};

export default UpdatesCatalog;