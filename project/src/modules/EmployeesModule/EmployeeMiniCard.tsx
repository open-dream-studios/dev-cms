// project/src/modules/EmployeesModule/EmployeeMiniCard.tsx
import { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import { formatPhone } from "@/util/functions/Customers";
import { Employee } from "@open-dream/shared";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useCurrentTheme } from "@/hooks/useTheme";
import { useContextMenuStore } from "@/store/util/contextMenuStore";
import { createEmployeeContextMenu } from "./_actions/employees.actions";
import { useQueryClient } from "@tanstack/react-query";

const EmployeeMiniCard = ({
  employee,
  index,
  handleEmployeeClick,
}: {
  employee: Employee;
  index: number;
  handleEmployeeClick: (employee: Employee) => void;
}) => {
  const queryClient = useQueryClient();
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { currentEmployee } = useCurrentDataStore();
  const { openContextMenu } = useContextMenuStore();

  if (!currentUser) return null;

  return (
    <div
      key={index}
      onContextMenu={(e) => {
        e.preventDefault();
        openContextMenu({
          position: { x: e.clientX, y: e.clientY },
          target: employee,
          menu: createEmployeeContextMenu(queryClient),
        });
      }}
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
      className="w-full h-[70px] pl-[14px] pr-[7px] flex flex-row gap-[10px] items-center rounded-[12px] 
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

export default EmployeeMiniCard;
