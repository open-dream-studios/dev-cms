// project/src/modules/EmployeesModule/EmployeeCatalog.tsx
import { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import EmployeeView from "./EmployeeView";
import ModuleLeftBar from "../components/ModuleLeftBar";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";

const EmployeeCatalog = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentEmployee, currentProjectId } = useCurrentDataStore();
  const { addingEmployee } = useUiStore();

  if (!currentUser || !currentProjectId) return null;

  return (
    <div className="flex w-full h-[100%]">
      <ModuleLeftBar />
      <div className="flex-1">
        {(currentEmployee || addingEmployee) && <EmployeeView />}
      </div>
    </div>
  );
};

export default EmployeeCatalog;
