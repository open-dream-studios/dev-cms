// project/src/components/Settings/UserAccess.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useModal1Store, useModal2Store } from "@/store/useModalStore";
import { ProjectUser, UserRole, validUserRoles } from "@/types/project";
import { appTheme } from "@/util/appTheme";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import { useContext, useMemo, useState } from "react";
import { FaPlus, FaRegCircleCheck } from "react-icons/fa6";
import { useProjectUserForm } from "@/hooks/useProjectUserForm";
import { ProjectUserFormData } from "@/util/schemas/projectUserSchema";
import { IoClose } from "react-icons/io5";
import { FiEdit } from "react-icons/fi";
import { useProjectContext } from "@/contexts/projectContext";

const UserAccess = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId, setCurrentProjectId } = useProjectContext();
  const { updateProjectUser, projectUsers, deleteProjectUser, projectsData } =
    useContextQueries();

  const currentProject = useMemo(() => {
    return projectsData.find((p) => p.id === currentProjectId) ?? null;
  }, [projectsData, currentProjectId]);

  const modal1 = useModal1Store((state: any) => state.modal1);
  const setModal1 = useModal1Store((state: any) => state.setModal1);
  if (!currentUser || !currentProject) return null;

  const emailsInProject = projectUsers
    .filter((u) => u.project_idx === currentProject.id)
    .map((u) => u.email);

  const form = useProjectUserForm(emailsInProject);

  const onSubmit = async (data: ProjectUserFormData) => {
    if (!currentProject) return;
    await updateProjectUser({
      email: data.email,
      role: data.role as UserRole,
      project_idx: currentProject.id,
    } as ProjectUser);
    setShowAddProjectInput(false);
  };

  const [showAddProjectInput, setShowAddProjectInput] =
    useState<boolean>(false);
  const [editListMode, setEditListMode] = useState<boolean>(false);

  const handleClearProject = () => {
    setModal1({ ...modal1, open: false });
    setCurrentProjectId(null);
  };

  const handleShowAddUserInput = () => {
    form.reset({ email: "", role: validUserRoles[1] });
    setShowAddProjectInput(true);
    setEditListMode(false);
  };

  const rowIsOwnerOrAdmin = () => {
    return (
      projectUsers.findIndex(
        (user: ProjectUser) =>
          user.email === currentUser.email &&
          user.project_idx === currentProject.id &&
          user.role === "owner"
      ) !== -1 ||
      projectUsers.findIndex(
        (user: ProjectUser) =>
          user.email === currentUser.email &&
          user.project_idx === currentProject.id &&
          user.role === "admin"
      ) !== -1 ||
      currentUser.admin === 1
    );
  };

  const getCurrentRole = () => {
    const indexFound = projectUsers.findIndex(
      (user: ProjectUser) =>
        user.email === currentUser.email &&
        user.project_idx === currentProject.id
    );
    if (indexFound === -1) return null;
    return projectUsers[indexFound].role;
  };

  const handleDeleteProjectUser = async (user: ProjectUser) => {
    if (!currentProject) return;
    await deleteProjectUser(user);
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="ml-[5px] md:ml-[8px] w-full h-full flex flex-col pt-[50px]"
    >
      <div className="ml-[1px] flex flex-row gap-[13.5px] items-center lg:mb-[18px] mb-[14px]">
        <p className="mt-[-4px] font-[600] h-[36px] text-[29px] leading-[29px] md:text-[32px] md:leading-[32px]">
          User Access
        </p>
        {currentProject !== null && rowIsOwnerOrAdmin() && (
          <>
            {!showAddProjectInput ? (
              <div className="flex flex-row gap-[11.5px]">
                <div
                  onClick={() => setEditListMode((prev) => !prev)}
                  className="select-none dim hover:brightness-75 cursor-pointer w-[36px] h-[36px] rounded-full flex justify-center items-center"
                  style={{
                    backgroundColor: appTheme[currentUser.theme].background_1_2,
                    border: editListMode
                      ? "1px solid " + appTheme[currentUser.theme].text_3
                      : "none",
                  }}
                >
                  <FiEdit size={16} />
                </div>

                <div
                  onClick={handleShowAddUserInput}
                  className="dim hover:brightness-75 cursor-pointer w-[36px] h-[36px] rounded-full flex justify-center items-center"
                  style={{
                    backgroundColor: appTheme[currentUser.theme].background_1_2,
                  }}
                >
                  <FaPlus size={16} />
                </div>
              </div>
            ) : (
              <div className="flex flex-row gap-[11.5px]">
                <div
                  className="select-none dim hover:brightness-75 cursor-pointer text-[14.5px] h-[36px] mt-[-0.6px] rounded-full flex justify-center items-center gap-[6px] pl-[16px] pr-[15px]"
                  style={{
                    backgroundColor: appTheme[currentUser.theme].background_1_2,
                    color: appTheme[currentUser.theme].text_3,
                  }}
                  onClick={() => setShowAddProjectInput(false)}
                >
                  <p className=" mt-[-0.5px]">Cancel</p>
                  <IoClose size={19} className="mt-[1px]" />
                </div>
                <button
                  type="submit"
                  className="select-none dim hover:brightness-75 cursor-pointer text-[15px] h-[36px] rounded-full mt-[-0.4px] flex justify-center items-center gap-[9px] pl-[16px] pr-[15px]"
                  style={{
                    backgroundColor: appTheme[currentUser.theme].background_1_2,
                    color: appTheme[currentUser.theme].text_3,
                  }}
                >
                  <p className=" mt-[-1.5px]">Save</p>
                  <FaRegCircleCheck size={16} className="mt-[1px]" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div
        className="w-[90%] max-h-[305px] overflow-y-scroll rounded-[8px]"
        style={{ backgroundColor: appTheme[currentUser.theme].background_1_2 }}
      >
        {showAddProjectInput && (
          <div
            className="w-[100%]"
            style={{
              backgroundColor: appTheme[currentUser.theme].background_2_2,
            }}
          >
            <div
              style={{ color: appTheme[currentUser.theme].text_4 }}
              className="relative w-[100%] h-[50px] text-[15.5px] leading-[22px] gap-[10px] font-[400] flex flex-row items-center justify-between px-[20px]"
            >
              <input
                {...form.register("email")}
                placeholder="Add email..."
                onChange={(e) => {
                  form.setValue("email", e.target.value, {
                    shouldValidate: false,
                  });
                  form.clearErrors("email");
                }}
                style={
                  {
                    "--custom-input-text-color":
                      appTheme[currentUser.theme].text_4,
                    color: appTheme[currentUser.theme].text_4,
                    backgroundColor: "transparent",
                  } as React.CSSProperties
                }
                className="outline-none input w-[100%] py-[6px] rounded-[5px] text-[14px]"
              />
              {form.formState.isSubmitted && form.formState.errors.email && (
                <div
                  className="absolute z-[352] right-[96px] top-[9.5px] py-[8px] text-[16px] px-[11px] rounded-[6px]"
                  style={{
                    backgroundColor: appTheme[currentUser.theme].background_1_2,
                  }}
                >
                  <p className="text-red-500 text-xs">
                    {form.formState.errors.email.message}
                  </p>
                </div>
              )}
              <select
                {...form.register("role")}
                style={{
                  border: `0.5px solid ${
                    appTheme[currentUser.theme].background_4
                  }`,
                }}
                className="cursor-pointer hover:brightness-75 w-[71px] text-center custom-select input py-[4px] text-[12px] rounded-[5px]"
              >
                {validUserRoles &&
                  validUserRoles
                    .filter((role: UserRole) => role !== "admin")
                    .map((role: string) => (
                      <option key={role} value={role}>
                        {capitalizeFirstLetter(role)}
                      </option>
                    ))}
              </select>
            </div>
          </div>
        )}

        {currentProject !== null &&
          projectUsers
            .filter(
              (userObject: ProjectUser) =>
                userObject.project_idx === currentProject.id
            )
            .map((user: ProjectUser, index: number) => {
              return (
                <div key={index} className="w-[100%] relative">
                  {(index !== 0 || showAddProjectInput) && (
                    <div
                      style={{
                        backgroundColor: appTheme[currentUser.theme].text_4,
                      }}
                      className="w-[100%] h-[1px] rounded-[2px] opacity-[0.5]"
                    />
                  )}
                  <div
                    style={{ color: appTheme[currentUser.theme].text_4 }}
                    className="w-[100%] h-[50px] text-[15.5px] leading-[22px] font-[400] flex flex-row items-center justify-between px-[20px]"
                  >
                    <p>{user.email}</p>

                    <div className="w-[auto] flex flex-row gap-[14px] items-center h-[100%]">
                      {rowIsOwnerOrAdmin() &&
                      user.role !== "admin" &&
                      user.email !== currentUser.email ? (
                        <select
                          value={user.role}
                          style={{
                            border: `0.5px solid ${
                              appTheme[currentUser.theme].background_4
                            }`,
                          }}
                          className="cursor-pointer hover:brightness-75 dim w-[61px] text-center custom-select input py-[4px] text-[12px] rounded-[5px]"
                          onChange={async (e) => {
                            const newRole = e.target.value;
                            await updateProjectUser({
                              ...user,
                              id: currentProject.id,
                              project_id: currentProject.project_id,
                              role: newRole,
                            } as ProjectUser);
                          }}
                        >
                          {validUserRoles &&
                            validUserRoles
                              .filter((role: UserRole) => role !== "admin")
                              .map((role: string) => (
                                <option key={role} value={role}>
                                  {capitalizeFirstLetter(role)}
                                </option>
                              ))}
                        </select>
                      ) : (
                        <div
                          className="w-[61px] select-none text-center custom-select input py-[4px] text-[12px] rounded-[5px]"
                          style={{
                            border: `0.5px solid ${
                              appTheme[currentUser.theme].background_4
                            }`,
                          }}
                        >
                          {capitalizeFirstLetter(user.role)}
                        </div>
                      )}
                      {editListMode && (
                        <div
                          onClick={() => handleDeleteProjectUser(user)}
                          style={{
                            backgroundColor:
                              appTheme[currentUser.theme].background_2_2,
                          }}
                          className={`${
                            currentUser.admin === 1 && user.role !== "admin"
                              ? ""
                              : (user.role === "admin" ||
                                  (getCurrentRole() !== "admin" &&
                                    getCurrentRole() !== "owner") ||
                                  (user.role === "owner" &&
                                    getCurrentRole() !== "admin")) &&
                                "opacity-0 pointer-events-none"
                          } cursor-pointer hover:brightness-75 dim w-[18px] h-[18px] rounded-full flex items-center justify-center mr-[-5px] mt-[-1px]`}
                        >
                          <div
                            className="w-[9px] h-[1.5px] rounded-[3px]"
                            style={{
                              backgroundColor:
                                appTheme[currentUser.theme].text_4,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
    </form>
  );
};

export default UserAccess;
