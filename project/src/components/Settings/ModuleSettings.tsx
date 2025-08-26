// // // project/src/components/Settings/ModuleSettings.tsx
// // "use client";
// // import { AuthContext } from "@/contexts/authContext";
// // import { useContextQueries } from "@/contexts/queryContext";
// // import { useModal1Store, useModal2Store } from "@/store/useModalStore";
// // import { ProjectUser, UserRole, validUserRoles } from "@/types/project";
// // import { appTheme } from "@/util/appTheme";
// // import { useContext, useState } from "react";
// // import { useProjectUserForm } from "@/hooks/useProjectUserForm";
// // import { ProjectUserFormData } from "@/util/schemas/projectUserSchema";
// // import { AiFillAppstore } from "react-icons/ai";
// // import { FiEdit } from "react-icons/fi";
// // import { FaPlus, FaRegCircleCheck } from "react-icons/fa6";
// // import { IoClose } from "react-icons/io5";
// // import { capitalizeFirstLetter } from "@/util/functions/Data";
// // import { useProjectContext } from "@/contexts/projectContext";
// // import { makeRequest } from "@/util/axios";

// // const ModuleSettings = () => {
// //   const { currentUser } = useContext(AuthContext);
// //   const { currentProject, setCurrentProject } = useProjectContext();
// //   const {
// //     projectsData,
// //     updateProjectUser,
// //     projectUsers,
// //     deleteProjectUser,
// //     addProjectModule,
// //   } = useContextQueries();

// //   const modal1 = useModal1Store((state: any) => state.modal1);
// //   const setModal1 = useModal1Store((state: any) => state.setModal1);
// //   const modal2 = useModal2Store((state: any) => state.modal2);
// //   const setModal2 = useModal2Store((state: any) => state.setModal2);

// //   if (!currentUser || !currentProject) return null;

// //   const emailsInProject = projectUsers
// //     .filter((u) => u.project_id === currentProject.id)
// //     .map((u) => u.email);

// //   const form = useProjectUserForm(emailsInProject);

// //   const onSubmit = async (data: ProjectUserFormData) => {
// //     if (!currentProject) return;
// //     // await updateProjectUser({
// //     //   email: data.email,
// //     //   role: data.role as UserRole,
// //     //   id: currentProject.id,
// //     //   project_id: currentProject.project_id,
// //     // } as ProjectUser);

// //     console.log("Adding key");
// //     await makeRequest.post("/api/integrations", {
// //       project_idx: currentProject.id,
// //       module: "wix",
// //       config: {
// //         secret: "wix-secret",
// //         apiKey: "wix-api-key",
// //       },
// //     });

// //     setShowAddProjectInput(false);
// //   };

// //   const [showAddProjectInput, setShowAddProjectInput] =
// //     useState<boolean>(false);
// //   const [editListMode, setEditListMode] = useState<boolean>(false);

// //   const handleClearProject = () => {
// //     setModal1({ ...modal1, open: false });
// //     setCurrentProject(null);
// //   };

// //   const handleShowAddUserInput = () => {
// //     form.reset({ email: "", role: validUserRoles[1] });
// //     setShowAddProjectInput(true);
// //     setEditListMode(false);
// //   };

// //   const rowIsOwnerOrAdmin = () => {
// //     return (
// //       projectUsers.findIndex(
// //         (user: ProjectUser) =>
// //           user.email === currentUser.email &&
// //           user.project_id === currentProject.id &&
// //           user.role === "owner"
// //       ) !== -1 ||
// //       projectUsers.findIndex(
// //         (user: ProjectUser) =>
// //           user.email === currentUser.email &&
// //           user.project_id === currentProject.id &&
// //           user.role === "admin"
// //       ) !== -1 ||
// //       currentUser.admin === 1
// //     );
// //   };

// //   const getCurrentRole = () => {
// //     const indexFound = projectUsers.findIndex(
// //       (user: ProjectUser) =>
// //         user.email === currentUser.email &&
// //         user.project_id === currentProject.id
// //     );
// //     if (indexFound === -1) return null;
// //     return projectUsers[indexFound].role;
// //   };

// //   const handleDeleteProjectUser = async (user: ProjectUser) => {
// //     if (!currentProject) return;
// //     await deleteProjectUser(user);
// //   };

// //   const handleAddModule = async () => {
// //     await addProjectModule({
// //       project_id: currentProject.id,
// //       module_id: 1,
// //       settings: { apiKey: "abc123" }
// //     });
// //   };

// //   return (
// //     <form
// //       onSubmit={form.handleSubmit(onSubmit)}
// //       className="ml-[5px] md:ml-[8px] w-full h-full flex flex-col pt-[50px]"
// //     >
// //       <div className="ml-[1px] flex flex-row gap-[13.5px] items-center lg:mb-[18px] mb-[14px]">
// //         <p className="mt-[-2px] font-[600] text-[29px] leading-[29px] h-[36px] md:text-[32px] md:leading-[32px]">
// //           Modules
// //         </p>

// //         {currentProject !== null && projectsData.length > 1 && (
// //           <div
// //             onClick={handleAddModule}
// //             className="flex w-[auto] cursor-pointer h-[100%] items-center rounded-full transition-colors duration-500 group"
// //           >
// //             <AiFillAppstore
// //               color={appTheme[currentUser.theme].text_3}
// //               size={29}
// //             />
// //           </div>
// //         )}

// //         {currentProject !== null && rowIsOwnerOrAdmin() && (
// //           <>
// //             {!showAddProjectInput ? (
// //               <div className="flex flex-row gap-[11.5px]">
// //                 <div
// //                   onClick={() => setEditListMode((prev) => !prev)}
// //                   className="select-none dim hover:brightness-75 cursor-pointer w-[36px] h-[36px] rounded-full flex justify-center items-center"
// //                   style={{
// //                     backgroundColor: appTheme[currentUser.theme].background_1_2,
// //                     border: editListMode
// //                       ? "1px solid " + appTheme[currentUser.theme].text_3
// //                       : "none",
// //                   }}
// //                 >
// //                   <FiEdit size={16} />
// //                 </div>

// //                 <div
// //                   onClick={handleShowAddUserInput}
// //                   className="dim hover:brightness-75 cursor-pointer w-[36px] h-[36px] rounded-full flex justify-center items-center"
// //                   style={{
// //                     backgroundColor: appTheme[currentUser.theme].background_1_2,
// //                   }}
// //                 >
// //                   <FaPlus size={16} />
// //                 </div>
// //               </div>
// //             ) : (
// //               <div className="flex flex-row gap-[11.5px]">
// //                 <div
// //                   className="dim hover:brightness-75 cursor-pointer text-[14.5px] h-[36px] mt-[-0.6px] rounded-full flex justify-center items-center gap-[6px] pl-[16px] pr-[15px]"
// //                   style={{
// //                     backgroundColor: appTheme[currentUser.theme].background_1_2,
// //                     color: appTheme[currentUser.theme].text_3,
// //                   }}
// //                   onClick={() => setShowAddProjectInput(false)}
// //                 >
// //                   <p className=" mt-[-0.5px]">Cancel</p>
// //                   <IoClose size={19} className="mt-[1px]" />
// //                 </div>
// //                 <button
// //                   type="submit"
// //                   className="dim hover:brightness-75 cursor-pointer text-[15px] h-[36px] rounded-full mt-[-0.4px] flex justify-center items-center gap-[9px] pl-[16px] pr-[15px]"
// //                   style={{
// //                     backgroundColor: appTheme[currentUser.theme].background_1_2,
// //                     color: appTheme[currentUser.theme].text_3,
// //                   }}
// //                 >
// //                   <p className=" mt-[-1.5px]">Save</p>
// //                   <FaRegCircleCheck size={16} className="mt-[1px]" />
// //                 </button>
// //               </div>
// //             )}
// //           </>
// //         )}
// //       </div>

// //       <div
// //         className="w-[90%] max-h-[305px] overflow-y-scroll rounded-[8px]"
// //         style={{ backgroundColor: appTheme[currentUser.theme].background_1_2 }}
// //       >
// //         {showAddProjectInput && (
// //           <div
// //             className="w-[100%]"
// //             style={{
// //               backgroundColor: appTheme[currentUser.theme].background_2_2,
// //             }}
// //           >
// //             <div
// //               style={{ color: appTheme[currentUser.theme].text_4 }}
// //               className="relative w-[100%] h-[50px] text-[15.5px] leading-[22px] gap-[10px] font-[400] flex flex-row items-center justify-between px-[20px]"
// //             >
// //               <input
// //                 {...form.register("email")}
// //                 onChange={(e) => {
// //                   form.setValue("email", e.target.value, {
// //                     shouldValidate: false,
// //                   });
// //                   form.clearErrors("email");
// //                 }}
// //                 placeholder="Add email..."
// //                 className="outline-none input w-[100%] py-[6px] rounded-[5px] text-[14px]"
// //               />
// //               {form.formState.isSubmitted && form.formState.errors.email && (
// //                 <div
// //                   className="absolute z-[352] right-[96px] top-[9.5px] py-[8px] text-[16px] px-[11px] rounded-[6px]"
// //                   style={{
// //                     backgroundColor: appTheme[currentUser.theme].background_1_2,
// //                   }}
// //                 >
// //                   <p className="text-red-500 text-xs">
// //                     {form.formState.errors.email.message}
// //                   </p>
// //                 </div>
// //               )}
// //               <select
// //                 {...form.register("role")}
// //                 style={{
// //                   border: `0.5px solid ${
// //                     appTheme[currentUser.theme].background_4
// //                   }`,
// //                 }}
// //                 className="cursor-pointer hover:brightness-75 w-[61px] text-center custom-select input px-[12px] py-[4px] text-[12px] rounded-[5px]"
// //               >
// //                 {validUserRoles &&
// //                   validUserRoles
// //                     .filter((role: UserRole) => role !== "admin")
// //                     .map((role: string) => (
// //                       <option key={role} value={role}>
// //                         {capitalizeFirstLetter(role)}
// //                       </option>
// //                     ))}
// //               </select>
// //             </div>
// //           </div>
// //         )}

// //         {currentProject !== null &&
// //           projectUsers
// //             .filter(
// //               (userObject: ProjectUser) =>
// //                 userObject.project_id === currentProject.id
// //             )
// //             .map((user: ProjectUser, index: number) => {
// //               return (
// //                 <div key={index} className="w-[100%] relative">
// //                   {(index !== 0 || showAddProjectInput) && (
// //                     <div
// //                       style={{
// //                         backgroundColor: appTheme[currentUser.theme].text_4,
// //                       }}
// //                       className="w-[100%] h-[1px] rounded-[2px] opacity-[0.5]"
// //                     />
// //                   )}
// //                   <div
// //                     style={{ color: appTheme[currentUser.theme].text_4 }}
// //                     className="w-[100%] h-[50px] text-[15.5px] leading-[22px] font-[400] flex flex-row items-center justify-between px-[20px]"
// //                   >
// //                     <p>{user.email}</p>

// //                     <div className="w-[auto] flex flex-row gap-[14px] items-center h-[100%]">
// //                       {rowIsOwnerOrAdmin() &&
// //                       user.role !== "admin" &&
// //                       user.email !== currentUser.email ? (
// //                         <select
// //                           value={user.role}
// //                           style={{
// //                             border: `0.5px solid ${
// //                               appTheme[currentUser.theme].background_4
// //                             }`,
// //                           }}
// //                           className="cursor-pointer hover:brightness-75 dim w-[61px] text-center custom-select input px-[12px] py-[4px] text-[12px] rounded-[5px]"
// //                           onChange={async (e) => {
// //                             const newRole = e.target.value;
// //                             await updateProjectUser({
// //                               ...user,
// //                               id: currentProject.id,
// //                               project_id: currentProject.project_id,
// //                               role: newRole,
// //                             } as ProjectUser);
// //                           }}
// //                         >
// //                           {validUserRoles &&
// //                             validUserRoles
// //                               .filter((role: UserRole) => role !== "admin")
// //                               .map((role: string) => (
// //                                 <option key={role} value={role}>
// //                                   {capitalizeFirstLetter(role)}
// //                                 </option>
// //                               ))}
// //                         </select>
// //                       ) : (
// //                         <div
// //                           className="select-none w-[61px] text-center custom-select input px-[12px] py-[4px] text-[12px] rounded-[5px]"
// //                           style={{
// //                             border: `0.5px solid ${
// //                               appTheme[currentUser.theme].background_4
// //                             }`,
// //                           }}
// //                         >
// //                           {capitalizeFirstLetter(user.role)}
// //                         </div>
// //                       )}
// //                       {editListMode && (
// //                         <div
// //                           onClick={() => handleDeleteProjectUser(user)}
// //                           style={{
// //                             backgroundColor:
// //                               appTheme[currentUser.theme].background_2_2,
// //                           }}
// //                           className={`${
// //                             currentUser.admin === 1 && user.role !== "admin"
// //                               ? ""
// //                               : (user.role === "admin" ||
// //                                   (getCurrentRole() !== "admin" &&
// //                                     getCurrentRole() !== "owner") ||
// //                                   (user.role === "owner" &&
// //                                     getCurrentRole() !== "admin")) &&
// //                                 "opacity-0 pointer-events-none"
// //                           } cursor-pointer hover:brightness-75 dim w-[18px] h-[18px] rounded-full flex items-center justify-center mr-[-5px] mt-[-1px]`}
// //                         >
// //                           <div
// //                             className="w-[9px] h-[1.5px] rounded-[3px]"
// //                             style={{
// //                               backgroundColor:
// //                                 appTheme[currentUser.theme].text_4,
// //                             }}
// //                           />
// //                         </div>
// //                       )}
// //                     </div>
// //                   </div>
// //                 </div>
// //               );
// //             })}
// //       </div>
// //     </form>
// //   );
// // };

// // export default ModuleSettings;

// // project/src/components/Settings/ModuleSettings.tsx
// "use client";
// import { useState, useContext, useEffect } from "react";
// import { AuthContext } from "@/contexts/authContext";
// import { useProjectContext } from "@/contexts/projectContext";
// import { useContextQueries } from "@/contexts/queryContext";
// import { makeRequest } from "@/util/axios";
// import { appTheme } from "@/util/appTheme";
// import { AiFillAppstore } from "react-icons/ai";
// import { FaPlus, FaRegCircleCheck } from "react-icons/fa6";
// import { IoClose } from "react-icons/io5";
// import { FiEdit } from "react-icons/fi";
// import { useIntegrationForm } from "@/hooks/useIntegrationForm";
// import { IntegrationFormData } from "@/util/schemas/integrationSchema";

// type IntegrationConfig = Record<string, string>;

// const ModuleSettings = () => {
//   const { currentUser } = useContext(AuthContext);
//   const { currentProject } = useProjectContext();
//   const { projectModules, addProjectModule, upsertIntegration } =
//     useContextQueries();
//   console.log(projectModules);
//   const [selectedModule, setSelectedModule] = useState<number | null>(null);
//   const [integrationConfig, setIntegrationConfig] = useState<IntegrationConfig>(
//     {}
//   );
//   const [showAddInput, setShowAddInput] = useState(false);
//   const [newKey, setNewKey] = useState("");
//   const [newValue, setNewValue] = useState("");
//   const [editMode, setEditMode] = useState(false);

//   const form = useIntegrationForm();

//   const onSubmit = async (data: IntegrationFormData) => {
//     if (!selectedModule || !currentProject) return;
//     const newConfig = { ...integrationConfig, [data.key]: data.value };
//     await upsertIntegration({
//       project_idx: currentProject.id,
//       module: String(selectedModule),
//       config: newConfig,
//     });
//     form.reset();
//   };

//   useEffect(() => {
//     if (!selectedModule || !currentProject) return;
//     (async () => {
//       try {
//         const res = await makeRequest.post("/api/integrations", {
//           project_idx: currentProject.id,
//           module: selectedModule,
//         });
//         setIntegrationConfig(res.data.config || {});
//       } catch {
//         setIntegrationConfig({});
//       }
//     })();
//   }, [selectedModule, currentProject]);

//   if (!currentUser || !currentProject) return null;

//   const handleSaveIntegration = async () => {
//     if (!selectedModule) return;
//     await makeRequest.post("/api/integrations/update", {
//       project_idx: currentProject.id,
//       module: selectedModule,
//       config: integrationConfig,
//     });
//     setShowAddInput(false);
//     setNewKey("");
//     setNewValue("");
//   };

//   const handleAddKey = () => {
//     if (newKey && newValue) {
//       setIntegrationConfig({ ...integrationConfig, [newKey]: newValue });
//     }
//   };

//   return (
//     <div className="ml-[5px] md:ml-[8px] w-full h-full flex flex-col pt-[50px]">
//       <div className="ml-[1px] flex flex-row gap-[13.5px] items-center lg:mb-[18px] mb-[14px]">
//         <p className="mt-[-2px] font-[600] text-[29px] leading-[29px] h-[36px] md:text-[32px] md:leading-[32px]">
//           Modules
//         </p>
//         {/* <div
//           onClick={() =>
//             addProjectModule({
//               project_idx: currentProject.id,
//               module_id: 1,
//               settings: {},
//             })
//           }
//           className="cursor-pointer flex items-center"
//         >
//           <AiFillAppstore
//             color={appTheme[currentUser.theme].text_3}
//             size={29}
//           />
//         </div> */}
//       </div>

//       <div className="flex flex-row gap-4 mb-4">
//         {projectModules
//           // .filter((m) => m.project_idx === currentProject.id)
//           .map((m) => (
//             <div
//               key={m.module_id}
//               onClick={() => setSelectedModule(m.module_id)}
//               style={{
//                 backgroundColor:
//                   selectedModule === m.module_id
//                     ? appTheme[currentUser.theme].background_2_selected
//                     : appTheme[currentUser.theme].background_2_dim,
//               }}
//               className={`px-4 py-2 rounded-lg cursor-pointer `}
//             >
//               {m.name}
//             </div>
//           ))}
//       </div>

//       {selectedModule && (
//         <div
//           className="w-[90%] max-h-[305px] overflow-y-scroll rounded-[8px] p-4"
//           style={{
//             backgroundColor: appTheme[currentUser.theme].background_1_2,
//           }}
//         >
//           {Object.entries(integrationConfig).map(([key, value]) => (
//             <div
//               key={key}
//               className="flex flex-row justify-between items-center py-2"
//             >
//               <p className="font-medium">{key}</p>
//               {editMode ? (
//                 <input
//                   value={value}
//                   onChange={(e) =>
//                     setIntegrationConfig({
//                       ...integrationConfig,
//                       [key]: e.target.value,
//                     })
//                   }
//                   className="border rounded px-2 py-1"
//                 />
//               ) : (
//                 <p>{value}</p>
//               )}
//             </div>
//           ))}

//           {showAddInput && (
//             <div className="flex flex-row gap-2 mt-2">
//               <input
//                 value={newKey}
//                 onChange={(e) => setNewKey(e.target.value)}
//                 placeholder="Key"
//                 className="border rounded px-2 py-1"
//               />
//               <input
//                 value={newValue}
//                 onChange={(e) => setNewValue(e.target.value)}
//                 placeholder="Value"
//                 className="border rounded px-2 py-1"
//               />
//               <button
//                 type="button"
//                 onClick={handleAddKey}
//                 className="px-3 py-1 bg-green-500 text-white rounded"
//               >
//                 Add
//               </button>
//             </div>
//           )}

//           <div className="flex flex-row gap-2 mt-4">
//             <button
//               type="button"
//               onClick={() => setEditMode((p) => !p)}
//               className="flex items-center gap-2 px-3 py-1 bg-gray-300 rounded"
//             >
//               <FiEdit /> {editMode ? "Stop Editing" : "Edit"}
//             </button>
//             <button
//               type="button"
//               onClick={() => setShowAddInput((p) => !p)}
//               className="flex items-center gap-2 px-3 py-1 bg-gray-300 rounded"
//             >
//               {showAddInput ? (
//                 <>
//                   <IoClose /> Cancel
//                 </>
//               ) : (
//                 <>
//                   <FaPlus /> Add Key
//                 </>
//               )}
//             </button>
//             <button
//               type="button"
//               onClick={handleSaveIntegration}
//               className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded"
//             >
//               <FaRegCircleCheck /> Save
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ModuleSettings;

// project/src/components/Settings/ModuleSettings.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext";
import { useModal1Store } from "@/store/useModalStore";
import { Module, ProjectModule } from "@/types/project";
import { appTheme } from "@/util/appTheme";
import { useContext, useEffect, useState } from "react";
import { FaCheck, FaPlus, FaRegCircleCheck, FaTrash } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { useProjectContext } from "@/contexts/projectContext";

const ModuleSettings = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentProject, setCurrentProject } = useProjectContext();
  const { projectModules, deleteProjectModule, addProjectModule, modules } =
    useContextQueries();
  if (!currentUser || !currentProject) return null;

  const [showAddProjectInput, setShowAddProjectInput] =
    useState<boolean>(false);

  const handleDeleteProjectModule = async (projectModule: ProjectModule) => {
    if (!currentProject) return;
    deleteProjectModule({
      project_idx: currentProject.id,
      module_id: projectModule.module_id,
    });
  };

  const [addingModules, setAddingModules] = useState(false);
  const [selectedModules, setSelectedModules] = useState<number[]>([]);
  useEffect(() => {
    if (projectModules && projectModules.length > 0) {
      setSelectedModules(projectModules.map((pm) => pm.module_id));
    }
  }, [projectModules]);

  const toggleModule = (id: number) => {
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleModuleOptionClick = (module: Module) => {
    toggleModule(module.id);
    if (selectedModules.includes(module.id)) {
      deleteProjectModule({
        project_idx: currentProject.id,
        module_id: module.id,
      });
    } else {
      addProjectModule({
        project_idx: currentProject.id,
        module_id: module.id,
      });
    }
  };

  return (
    <div className="ml-[5px] md:ml-[8px] w-full h-full flex flex-col pt-[50px]">
      <div className="ml-[1px] flex flex-row gap-[13.5px] items-center lg:mb-[18px] mb-[14px]">
        <p className="mt-[-4px] font-[600] h-[36px] text-[29px] leading-[29px] md:text-[32px] md:leading-[32px]">
          Modules
        </p>
        {currentProject !== null && (
          <>
            {!showAddProjectInput ? (
              <>
                <div className="relative">
                  <div
                    onClick={() => setAddingModules((p) => !p)}
                    className="dim hover:brightness-75 cursor-pointer w-[36px] h-[36px] rounded-full flex justify-center items-center"
                    style={{
                      backgroundColor:
                        appTheme[currentUser.theme].background_1_2,
                    }}
                  >
                    <FaPlus size={14} />
                  </div>

                  {addingModules && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setAddingModules(false)}
                      />

                      <div
                        className="absolute top-[-2px] left-[-4px] z-50 bg-white dark:bg-gray-800 shadow-lg rounded-lg py-[4px] px-[8px] w-[200px]"
                        style={{
                          backgroundColor:
                            currentUser.theme === "dark"
                              ? "#2E2D2D"
                              : "#EFEFEF",
                          border:
                            currentUser.theme === "dark"
                              ? `0.5px solid #555555`
                              : `0.5px solid #EFEFEF`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {modules.map((m) => {
                          const checked = selectedModules.includes(m.id);
                          return (
                            <div
                              key={m.id}
                              onClick={() => {
                                handleModuleOptionClick(m);
                              }}
                              className="flex select-none items-center justify-start py-[1.5px] cursor-pointer hover:brightness-70 dim text-[15.5px]"
                            >
                              <div className="w-[18.9px]">
                                {checked && <FaCheck size={12} />}
                              </div>
                              <span className="w-[100%] truncate">
                                {m.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </>
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
        {currentProject !== null &&
          projectModules.map((projectModule: ProjectModule, index: number) => {
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
                  <p>{projectModule.name}</p>
                  <button
                    onClick={() => handleDeleteProjectModule(projectModule)}
                    style={{
                      backgroundColor:
                        appTheme[currentUser.theme].background_2_selected,
                    }}
                    className="flex items-center justify-center w-[32px] h-[32px] hover:brightness-[84%] dim cursor-pointer rounded-full"
                  >
                    <FaTrash
                      size={14}
                      color={appTheme[currentUser.theme].text_4}
                    />
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default ModuleSettings;
