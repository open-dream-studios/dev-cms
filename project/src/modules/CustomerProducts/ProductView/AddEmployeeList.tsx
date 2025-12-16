// project/src/modules/CustomerProducts/ProductView/AddEmployeeList.tsx
import React from "react";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext"; 
import { useContext } from "react";
import {
  Employee,
  EmployeeAssignmentInput,
  Job,
  Task,
} from "@open-dream/shared";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useCurrentTheme } from "@/hooks/useTheme";
import { useUiStore } from "@/store/useUIStore";

const AddEmployeeList = ({ assignment }: { assignment: Job | Task | null }) => {
  const { currentUser } = useContext(AuthContext);
  const { currentProject, currentProjectId } = useCurrentDataStore();
  const { addEmployeeAssignment, employees } = useContextQueries();
  const currentTheme = useCurrentTheme();
  const {  modal1, setModal1 } = useUiStore()

  const handleEmployeeClick = async (employee: Employee) => {
    if (!assignment || !employee?.employee_id || !currentProjectId) return;
    if ("task_id" in assignment && assignment.task_id) {
      await addEmployeeAssignment({
        employee_id: employee.employee_id,
        task_id: assignment.task_id,
        job_id: null,
        project_idx: currentProjectId,
      } as EmployeeAssignmentInput);
    }

    if (
      "job_id" in assignment &&
      assignment.job_id &&
      !("task_id" in assignment && assignment.task_id)
    ) {
      await addEmployeeAssignment({
        employee_id: employee.employee_id,
        task_id: null,
        job_id: String(assignment.job_id),
        project_idx: currentProjectId,
      } as EmployeeAssignmentInput);
    }
    setModal1({
      ...modal1,
      open: false,
    });
  };

  if (!currentUser || !currentProject) return null;

  return (
    <div className="w-[100%] h-[100%] pl-[50px] lg:pl-[80px] pr-[25px] lg:pr-[55px] pt-[40px] flex flex-col gap-[12px]">
      <div className="flex flex-row justify-between w-[100%] pr-[25px] items-center">
        <div className="text-[25px] md:text-[31px] font-[600]">
          {currentProject.short_name} Employees
        </div>
      </div>
      <div className="flex flex-col gap-[10px] pr-[25px] flex-1 overflow-auto pb-[30px]">
        {employees.map((employee: Employee, index: number) => {
          return (
            <div
              key={index}
              style={{
                backgroundColor: currentTheme.background_3,
              }}
              onClick={() => handleEmployeeClick(employee)}
              className="cursor-pointer hover:brightness-[86%] dim px-[18px] py-[5px] w-[100%] min-h-[60px] rounded-[12px] flex flex-row items-center"
            >
              <div className="w-[100%] h-[100%] items-center flex flex-row gap-[10px]">
                <div className="flex h-[100%] w-[100%] flex-col justify-center">
                  <div className="flex flex-row justify-between w-[100%]">
                    <div className="font-[600] text-[17px] leading-[19px]">
                      {employee.first_name} {employee.last_name}
                    </div>
                  </div>

                  <div className="flex flex-row justify-between w-[100%]">
                    {/* {employee.description && (
                      <div className="font-[500] text-[14px] opacity-[0.3]">
                        {definition.description ?? ""}
                      </div>
                    )} */}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AddEmployeeList;
