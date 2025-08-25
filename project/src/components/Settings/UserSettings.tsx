// project/src/components/Settings/UserSettings.tsx
"use client";
import { useAppContext } from "@/contexts/appContext";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext";
import Modal2MultiStepModalInput, {
  StepConfig,
} from "@/modals/Modal2MultiStepInput";
import { useModal1Store, useModal2Store } from "@/store/useModalStore";
import { ProjectUser, UserRole, validUserRoles } from "@/types/project";
import { appTheme } from "@/util/appTheme";
import { useContext } from "react";

const UserSettings = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentProject, setCurrentProject } = useAppContext();
  const { projectUsers, updateProjectUser } = useContextQueries();
  const modal1 = useModal1Store((state: any) => state.modal1);
  const setModal1 = useModal1Store((state: any) => state.setModal1);

  const modal2 = useModal2Store((state: any) => state.modal2);
  const setModal2 = useModal2Store((state: any) => state.setModal2);

  const handleClearProject = () => {
    setModal1({ ...modal1, open: false });
    setCurrentProject(null);
  };

  const handleAddUser = () => {
    const steps: StepConfig[] = [
      {
        name: "email",
        placeholder: "Enter User Email",
        validate: (val) =>
          /\S+@\S+\.\S+/.test(val) ? true : "Must be a valid email",
      },
      {
        name: "role",
        placeholder: "Assign a Role (owner, editor, viewer, admin)",
        validate: (val) =>
          validUserRoles.includes(val as UserRole)
            ? true
            : "Role must be one of: owner, editor, viewer, admin",
      },
    ];

    if (!currentProject || !currentUser) return null;

    setModal2({
      ...modal2,
      open: true,
      showClose: false,
      offClickClose: true,
      width: "w-[300px]",
      maxWidth: "max-w-[400px]",
      aspectRatio: "aspect-[5/2]",
      borderRadius: "rounded-[12px] md:rounded-[15px]",
      content: (
        <Modal2MultiStepModalInput
          steps={steps}
          onComplete={async (values) => {
            await updateProjectUser({
              id: currentProject.id,
              project_id: currentProject.project_id,
              project_name: currentProject.name,
              email: values.email,
              role: values.role,
            } as ProjectUser);
          }}
        />
      ),
    });
  };

  if (!currentUser) return null;

  return (
    <div className="ml-[5px] md:ml-[8px] w-full h-full flex flex-col pt-[50px]">
      <div className="ml-[1px] w-[90%] flex flex-col items-center justify-center">
        <p className="font-[600] lg:mb-[21px] mb-[19px] text-[29px] leading-[29px] md:text-[32px] md:leading-[32px] w-[100%] items-start">
          Settings
        </p>
      </div>

      <div
        onClick={handleClearProject}
        className="flex w-[auto] cursor-pointer h-[40px] rounded-[10px] transition-colors duration-500 group"
      >
        <div
          className="gap-[12px] h-full group-hover:border-0 group-hover:bg-[var(--hover-bg)] rounded-[10px] flex justify-left items-center px-[15px] truncate font-[500] text-[16px]"
          style={
            {
              border: "0.5px solid " + appTheme[currentUser.theme].text_4,
              transition: "background-color 0.2s ease-in-out",
              "--hover-bg": appTheme[currentUser.theme].background_2,
            } as React.CSSProperties
          }
        >
          <p
            style={{
              color: appTheme[currentUser.theme].text_2,
            }}
          >
            Switch Project
          </p>
        </div>
      </div>

      {currentProject !== null && (
        <div
          onClick={handleAddUser}
          className="flex w-[auto] cursor-pointer h-[40px] rounded-[10px] transition-colors duration-500 group"
        >
          <div
            className="gap-[12px] h-full group-hover:border-0 group-hover:bg-[var(--hover-bg)] rounded-[10px] flex justify-left items-center px-[15px] truncate font-[500] text-[16px]"
            style={
              {
                border: "0.5px solid " + appTheme[currentUser.theme].text_4,
                transition: "background-color 0.2s ease-in-out",
                "--hover-bg": appTheme[currentUser.theme].background_2,
              } as React.CSSProperties
            }
          >
            <p
              style={{
                color: appTheme[currentUser.theme].text_2,
              }}
            >
              Add User
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSettings;
