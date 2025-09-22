import { Job, Task } from "@/types/jobs";
import React from "react";

// project/src/modules/CustomerProducts/ProductView/ProductJobs.tsx
import { AuthContext } from "@/contexts/authContext";
import { useProjectContext } from "@/contexts/projectContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useModal1Store } from "@/store/useModalStore";
import { appTheme } from "@/util/appTheme";
import { useContext } from "react";
import { Employee } from "@/types/employees";

const AddEmployeeList = ({ assignment }: { assignment: Job | Task | null }) => {
  const { currentUser } = useContext(AuthContext);
  const { currentProject } = useProjectContext();
  const { addEmployeeAssignment, employees } = useContextQueries();
  const modal1 = useModal1Store((state: any) => state.modal1);
  const setModal1 = useModal1Store((state: any) => state.setModal1);

  const handleEmployeeClick = async (employee: Employee) => {
    if (!assignment || !employee?.employee_id) return;
    if ("task_id" in assignment && assignment.task_id) {
      await addEmployeeAssignment({
        employee_id: employee.employee_id,
        task_id: assignment.task_id,
      });
    }

    if (
      "job_id" in assignment &&
      assignment.job_id &&
      !("task_id" in assignment && assignment.task_id)
    ) {
      await addEmployeeAssignment({
        employee_id: employee.employee_id,
        job_id: String(assignment.job_id),
      });
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
                backgroundColor: appTheme[currentUser.theme].background_3,
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
