// project/src/modules/EmployeesModule/EmployeeCatalog.tsx
import { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import EmployeeView from "./EmployeeView";
import { formatPhone } from "@/util/functions/Customers";
import ModuleLeftBar from "../components/ModuleLeftBar";
import { Employee } from "@open-dream/shared";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { useCurrentTheme } from "@/hooks/useTheme";

export const EmployeeMiniCard = ({
  employee,
  index,
  handleContextMenu,
  handleEmployeeClick,
}: {
  employee: Employee;
  index: number;
  handleContextMenu: (e: any, employee: Employee) => void;
  handleEmployeeClick: (employee: Employee) => void;
}) => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { currentEmployee } = useCurrentDataStore();

  if (!currentUser) return null;

  return (
    <div
      key={index}
      onContextMenu={(e) => handleContextMenu(e, employee)}
      onClick={() => handleEmployeeClick(employee)}
      style={{
        background:
          currentEmployee &&
          currentEmployee.employee_id &&
          currentEmployee.employee_id === employee.employee_id
            ? "rgba(255,255,255,0.057)"
            : "rgba(255,255,255,0.028)",
        color: currentTheme.text_4,
      }}
      className="mb-[9.5px] w-full h-[70px] pl-[14px] pr-[7px] flex flex-row gap-[10px] items-center rounded-[12px] 
             hover:brightness-[85%] transition cursor-pointer shadow-sm"
    >
      <div
        className="flex items-center justify-center rounded-full border font-semibold text-[13px] min-w-[33px] min-h-[33px]"
        style={{
          borderColor: currentTheme.text_4,
          color: currentTheme.text_4,
        }}
      >
        {`${employee.first_name?.[0] ?? ""}${
          employee.last_name?.[0] ?? ""
        }`.toUpperCase()}
      </div>

      <div className="flex flex-col items-start justify-start overflow-hidden h-[58px] mt-[1px]">
        <p
          className="w-[100%] font-bold text-[16px] leading-[19px] truncate"
          style={{ color: currentTheme.text_4 }}
        >
          {employee.first_name} {employee.last_name}
        </p>

        <div className="w-[100%] flex flex-col text-[13px] leading-[22px] opacity-70 truncate">
          {employee.position && <p className="truncate">{employee.position}</p>}
          {employee.phone && (
            <p className="truncate">{formatPhone(employee.phone)}</p>
          )}
        </div>
      </div>
    </div>
  );
};

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
