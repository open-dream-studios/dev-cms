// project/src/modules/EmployeesModule/EmployeesModuleLeftBar.tsx
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import Divider from "@/lib/blocks/Divider";
import { Employee } from "@open-dream/shared";
import React, { useContext } from "react";
import { FaPlus } from "react-icons/fa6";
import EmployeeMiniCard from "../EmployeesModule/EmployeeMiniCard";
import { employeeToForm } from "@/util/schemas/employeeSchema";
import { useUiStore } from "@/store/useUIStore";
import { useFormInstanceStore } from "@/store/util/formInstanceStore";
import { setCurrentEmployeeData } from "@/store/currentDataStore";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import CatalogMiniCardSkeleton from "@/lib/skeletons/CatalogMiniCardSkeleton";
import { homeLayoutLeftBarTopHeight } from "@/layouts/homeLayout";
import { onEmployeeFormSubmit } from "./_actions/employees.actions";
import { useQueryClient } from "@tanstack/react-query";

const EmployeesModuleLeftBar = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useContext(AuthContext);
  const { employees, isLoadingEmployees } = useContextQueries();
  const { getForm } = useFormInstanceStore();
  const { setAddingEmployee } = useUiStore();
  const currentTheme = useCurrentTheme();

  const employeeForm = getForm("employee");

  const handleEmployeeClick = async (employee: Employee | null) => {
    if (employeeForm && employeeForm.formState.isDirty) {
      await employeeForm.handleSubmit((data) =>
        onEmployeeFormSubmit(queryClient, data)
      )();
    }
    setCurrentEmployeeData(employee);
    setAddingEmployee(!employee);
    if (employeeForm && !employee) {
      employeeForm.reset(employeeToForm(null));
    }
  };

  if (!currentUser) return null;

  return (
    <div
      className={`hidden md:flex  w-[240px] min-w-[240px] h-full flex-col min-h-0 overflow-hidden`}
      style={{
        borderRight: `0.5px solid ${currentTheme.background_2}`,
      }}
    >
      <div className="flex flex-col px-[15px] pb-[8px]">
        <div
          className="flex flex-row items-center justify-between pt-[12px] pb-[6px]"
          style={{ height: homeLayoutLeftBarTopHeight }}
        >
          <div className="select-none flex flex-row gap-[13.5px] items-center w-[100%]">
            <p className="w-[100%] font-[600] h-[40px] truncate text-[24px] leading-[30px] mt-[1px]">
              Employees
            </p>
          </div>
          <div className="flex flex-row gap-[6px]">
            <div
              onClick={() => handleEmployeeClick(null)}
              className="dim cursor-pointer hover:brightness-[85%] min-w-[30px] w-[30px] h-[30px] mt-[-5px] rounded-full flex justify-center items-center"
              style={{
                backgroundColor: currentTheme.background_1_2,
              }}
            >
              <FaPlus size={12} />
            </div>
          </div>
        </div>
        <Divider />
      </div>

      <div className="flex-1 min-h-0 h-[100%]">
        <div className="w-[100%] h-[100%] px-[15px] pb-[20px] flex flex-col overflow-y-auto gap-[9px]">
          {isLoadingEmployees
            ? Array.from({ length: 4 }, (_, index) => {
                return <CatalogMiniCardSkeleton key={index} />;
              })
            : employees.map((employee: Employee, index: number) => {
                return (
                  <EmployeeMiniCard
                    key={index}
                    employee={employee}
                    index={index}
                    handleEmployeeClick={handleEmployeeClick}
                  />
                );
              })}
        </div>
      </div>
    </div>
  );
};

export default EmployeesModuleLeftBar;
