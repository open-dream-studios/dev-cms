// project/src/modules/EmployeesModule/EmployeesModule.tsx
import { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import EmployeeView from "./EmployeeView";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { HomeLayout } from "@/layouts/homeLayout";
import EmployeesModuleLeftBar from "./EmployeesModuleLeftBar";

const EmployeesModule = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentEmployee, currentProjectId } = useCurrentDataStore();
  const { addingEmployee } = useUiStore();

  if (!currentUser || !currentProjectId) return null;

  return (
    <HomeLayout left={<EmployeesModuleLeftBar />}>
      {(currentEmployee || addingEmployee) && <EmployeeView />}
    </HomeLayout>
  );
};

export default EmployeesModule;
