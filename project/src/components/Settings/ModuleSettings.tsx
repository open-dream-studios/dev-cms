"use client";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext";
import { Integration, Module, ProjectModule } from "@/types/project";
import { appTheme } from "@/util/appTheme";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { FaCheck, FaPlus, FaRegCircleCheck, FaTrash } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { useProjectContext } from "@/contexts/projectContext";
import { useIntegrationForm } from "@/hooks/useIntegrationForm";
import { IntegrationFormData } from "@/util/schemas/integrationSchema";
import { MdChevronLeft } from "react-icons/md";
import { HiLockClosed } from "react-icons/hi2";
import { FiEdit } from "react-icons/fi";

type IntegrationConfig = Record<string, string>;

const ModuleSettings = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId } = useProjectContext();
  const {
    projectModules,
    deleteProjectModule,
    addProjectModule,
    modules,
    integrations,
    upsertIntegration,
    deleteIntegrationKey,
    projectsData,
  } = useContextQueries();
  const currentProject = projectsData.find((p) => p.id === currentProjectId);

  if (!currentUser || !currentProject) return null;

  const [addingModules, setAddingModules] = useState(false);
  const [checkedModules, setCheckedModules] = useState<number[]>([]);

  const [selectedParentModule, setSelectedParentModule] =
    useState<ProjectModule | null>(null);
  const [editingModule, setEditingModule] = useState<ProjectModule | null>(
    null
  );

  const [integrationConfig, setIntegrationConfig] = useState<IntegrationConfig>(
    {}
  );
  const [showAddKeyInput, setShowAddKeyInput] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");

  const form = useIntegrationForm();

  useEffect(() => {
    if (projectModules && projectModules.length > 0) {
      setCheckedModules(projectModules.map((pm) => pm.module_id));
    }
  }, [projectModules]);

  const toggleModule = (id: number) => {
    setCheckedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleModuleOptionClick = (module: Module) => {
    toggleModule(module.id);
    if (checkedModules.includes(module.id)) {
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

  const handleDeleteProjectModule = async (projectModule: ProjectModule) => {
    if (!currentProject) return;
    deleteProjectModule({
      project_idx: currentProject.id,
      module_id: projectModule.module_id,
    });
  };

  const handleDeleteProjectModuleClick = async (
    e: React.MouseEvent<HTMLDivElement>,
    projectModule: ProjectModule
  ) => {
    e.stopPropagation();
    await handleDeleteProjectModule(projectModule);
  };

  const handleProjectModuleClick = (projectModule: ProjectModule) => {
    if (!editingModule && selectedParentModule === null) {
      setSelectedParentModule(projectModule);
    }
  };

  const handleEditModuleClick = (
    e: React.MouseEvent<HTMLDivElement>,
    projectModule: ProjectModule
  ) => {
    e.stopPropagation();
    setEditingModule(projectModule);
  };

  const handleBackClick = () => {
    if (editingModule) {
      setEditingModule(null);
      setIntegrationConfig({});
      setShowAddKeyInput(false);
      form.reset();
    } else if (selectedParentModule) {
      setSelectedParentModule(null);
    }
  };

  const filteredActiveModules = useMemo(() => {
    return selectedParentModule === null
      ? projectModules.filter((m) => m.parent_module_id === null)
      : projectModules.filter(
          (m) => m.parent_module_id === selectedParentModule.module_id
        );
  }, [projectModules, selectedParentModule]);

  const filteredSelectableModules = useMemo(() => {
    return selectedParentModule === null
      ? modules.filter((m) => m.parent_module_id === null)
      : modules.filter(
          (m) => m.parent_module_id === selectedParentModule.module_id
        );
  }, [modules, selectedParentModule]);

  useEffect(() => {
    if (!editingModule || !currentProject) return;
    try {
      const integration = integrations.find(
        (i: Integration) => i.module_id === editingModule.module_id
      );
      setIntegrationConfig(integration?.config || {});
    } catch {
      setIntegrationConfig({});
    }
  }, [editingModule, currentProject, integrations]);

  const onSubmit = async (data: IntegrationFormData) => {
    if (!editingModule || !currentProject) return;
    if (integrationConfig[data.key] !== undefined) {
      alert("That key already exists. Please use a unique key.");
      return;
    }
    const newConfig = { ...integrationConfig, [data.key]: data.value };
    try {
      await upsertIntegration({
        project_idx: currentProject.id,
        module_id: editingModule.module_id,
        config: newConfig,
      });
      setIntegrationConfig(newConfig);
      setShowAddKeyInput(false);
      form.reset();
    } catch (err) {
      console.error("Failed to save integration:", err);
    }
  };

  const handleDeleteIntegration = async (key: string) => {
    if (!editingModule) return;
    await deleteIntegrationKey({
      project_idx: currentProject.id,
      module_id: editingModule.module_id,
      key,
    });
  };

  const editKeyInputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="ml-[5px] md:ml-[8px] w-full h-full flex flex-col pt-[50px]"
    >
      <div className="ml-[1px] flex flex-row gap-[13.5px] items-center mb-[12px] w-[90%]">
        {(selectedParentModule || editingModule) && (
          <div
            onClick={handleBackClick}
            className="dim hover:brightness-75 cursor-pointer w-[36px] h-[36px] rounded-full flex justify-center items-center"
            style={{
              backgroundColor: appTheme[currentUser.theme].background_1_2,
            }}
          >
            <MdChevronLeft
              size={29}
              color={appTheme[currentUser.theme].text_2}
              className="ml-[-2px] mt-[-1px] opacity-[80%]"
            />
          </div>
        )}
        <p className="font-[600] h-[40px] truncate text-[29px] leading-[33px]">
          {editingModule
            ? editingModule.name
            : selectedParentModule
            ? selectedParentModule.name
            : "Modules"}
        </p>
        <div className="relative flex-1 flex">
          {editingModule ? (
            showAddKeyInput ? (
              <div className="flex gap-[11.5px]">
                <button
                  type="submit"
                  className="dim cursor-pointer text-[15px] h-[36px] rounded-full flex items-center gap-[9px] px-[15px]"
                  style={{
                    backgroundColor: appTheme[currentUser.theme].background_1_2,
                    color: appTheme[currentUser.theme].text_3,
                  }}
                >
                  Save <FaRegCircleCheck size={16} />
                </button>
                <div
                  onClick={() => setShowAddKeyInput(false)}
                  className="dim cursor-pointer text-[14.5px] h-[36px] rounded-full flex items-center gap-[6px] px-[15px]"
                  style={{
                    backgroundColor: appTheme[currentUser.theme].background_1_2,
                    color: appTheme[currentUser.theme].text_3,
                  }}
                >
                  Cancel <IoClose size={19} />
                </div>
              </div>
            ) : (
              <div
                onClick={() => setShowAddKeyInput(true)}
                className="dim cursor-pointer w-[36px] h-[36px] rounded-full flex justify-center items-center"
                style={{
                  backgroundColor: appTheme[currentUser.theme].background_1_2,
                }}
              >
                <FaPlus size={14} />
              </div>
            )
          ) : (
            <div
              onClick={() => setAddingModules(true)}
              className="dim cursor-pointer w-[36px] h-[36px] rounded-full flex justify-center items-center"
              style={{
                backgroundColor: appTheme[currentUser.theme].background_1_2,
              }}
            >
              <FaPlus size={14} />
            </div>
          )}

          {addingModules && !editingModule && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setAddingModules(false)}
              />
              <div
                className="absolute top-[-2px] left-[-4px] z-50 shadow-lg rounded-lg py-[4px] px-[8px] w-[200px]"
                style={{
                  backgroundColor:
                    currentUser.theme === "dark" ? "#2E2D2D" : "#EFEFEF",
                  border:
                    currentUser.theme === "dark"
                      ? `0.5px solid #555555`
                      : `0.5px solid #EFEFEF`,
                }}
              >
                {filteredSelectableModules.map((m) => {
                  const checked = checkedModules.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleModuleOptionClick(m)}
                      className="flex items-center py-[1.5px] cursor-pointer hover:brightness-70 dim text-[15.5px]"
                    >
                      <div className="w-[18.9px]">
                        {checked && <FaCheck size={12} />}
                      </div>
                      <span className="truncate">{m.name}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {!editingModule ? (
        <div
          className="w-[90%] max-h-[305px] overflow-y-scroll rounded-[8px]"
          style={{
            backgroundColor: appTheme[currentUser.theme].background_1_2,
          }}
        >
          {filteredActiveModules.map((projectModule, index) => (
            <div key={projectModule.module_id} className="w-[100%] relative">
              {index !== 0 && (
                <div
                  style={{
                    backgroundColor: appTheme[currentUser.theme].text_4,
                  }}
                  className="w-[100%] h-[1px] opacity-50"
                />
              )}
              <div
                onClick={() => handleProjectModuleClick(projectModule)}
                className={`group ${
                  selectedParentModule === null && "cursor-pointer"
                } w-[100%] h-[50px] flex justify-between items-center px-[20px]`}
                style={{ color: appTheme[currentUser.theme].text_4 }}
              >
                <p
                  className={`truncate ${
                    selectedParentModule === null && "group-hover:brightness-75"
                  } w-[calc(100%-85px)]`}
                >
                  {projectModule.name}
                </p>
                <div className="flex gap-[11px]">
                  <div
                    onClick={(e) => handleEditModuleClick(e, projectModule)}
                    className="flex items-center justify-center w-[33px] h-[33px] rounded-full dim cursor-pointer"
                    style={{
                      backgroundColor:
                        appTheme[currentUser.theme].background_2_selected,
                    }}
                  >
                    <HiLockClosed
                      size={15}
                      color={appTheme[currentUser.theme].text_4}
                    />
                  </div>
                  <div
                    onClick={(e) =>
                      handleDeleteProjectModuleClick(e, projectModule)
                    }
                    className="flex items-center justify-center w-[33px] h-[33px] rounded-full dim cursor-pointer"
                    style={{
                      backgroundColor:
                        appTheme[currentUser.theme].background_2_selected,
                    }}
                  >
                    <FaTrash
                      size={14}
                      color={appTheme[currentUser.theme].text_4}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="w-[90%] max-h-[305px] overflow-y-scroll rounded-[8px]"
          style={{
            backgroundColor: appTheme[currentUser.theme].background_1_2,
          }}
        >
          {showAddKeyInput && (
            <div
              className="w-[100%]"
              style={{
                backgroundColor: appTheme[currentUser.theme].background_2_2,
              }}
            >
              <div className="flex gap-[10px] px-[20px] h-[50px] items-center">
                <input
                  {...form.register("key")}
                  placeholder="Key..."
                  className="outline-none w-[50%] input py-[6px] rounded-[5px] text-[14px]"
                />
                <input
                  {...form.register("value")}
                  placeholder="Value..."
                  className="outline-none w-[50%] input py-[6px] rounded-[5px] text-[14px]"
                />
              </div>
            </div>
          )}

          {integrations
            .filter((i) => i.module_id === editingModule.module_id)
            .map((integration) =>
              Object.entries(integration.config).map(([k, v]) =>
                editingKey === k ? (
                  <div
                    key={k}
                    className="w-full flex px-[20px] h-[50px] items-center gap-[10px]"
                  >
                    <input
                      value={k}
                      disabled
                      className="outline-none w-[25%] input py-[6px] rounded-[5px] text-[14px] opacity-60"
                    />
                    <input
                      ref={editKeyInputRef}
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="outline-none flex-1 input py-[6px] rounded-[5px] text-[14px]"
                    />
                    <button
                      onClick={async () => {
                        const newConfig = {
                          ...integration.config,
                          [k]: tempValue,
                        };
                        await upsertIntegration({
                          project_idx: currentProject.id,
                          module_id: editingModule.module_id,
                          config: newConfig,
                        });
                        setEditingKey(null);
                      }}
                      className="cursor-pointer hover:brightness-90 dim px-[12px] h-[32px] rounded-full text-sm dim"
                      style={{
                        backgroundColor:
                          appTheme[currentUser.theme].background_2_selected,
                        color: appTheme[currentUser.theme].text_4,
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingKey(null)}
                      className="cursor-pointer hover:brightness-90 dim px-[12px] h-[32px] rounded-full text-sm dim"
                      style={{
                        backgroundColor:
                          appTheme[currentUser.theme].background_2_selected,
                        color: appTheme[currentUser.theme].text_4,
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div key={k} className="w-full relative">
                    <div className="flex justify-between items-center px-[20px] h-[50px] text-[14.5px]">
                      <p className="w-[40%] pr-[5px] truncate opacity-[50%]">
                        {k}
                      </p>
                      <p className="flex-1 pr-[69px] truncate opacity-[50%]">
                        {v}
                      </p>
                      <div className="absolute right-[12px] top-[9px] flex gap-[10px]">
                        <div
                          onClick={() => {
                            setEditingKey(k);
                            setTempValue(v as string);
                            setTimeout(() => {
                              if (editKeyInputRef.current) {
                                editKeyInputRef.current.focus();
                              }
                            }, 20);
                          }}
                          className="flex items-center justify-center w-[32px] h-[32px] rounded-full dim cursor-pointer"
                          style={{
                            backgroundColor:
                              appTheme[currentUser.theme].background_2_selected,
                          }}
                        >
                          <FiEdit
                            size={16}
                            color={appTheme[currentUser.theme].text_4}
                          />
                        </div>
                        <div
                          onClick={() => handleDeleteIntegration(k)}
                          className="flex items-center justify-center w-[32px] h-[32px] rounded-full dim cursor-pointer"
                          style={{
                            backgroundColor:
                              appTheme[currentUser.theme].background_2_selected,
                          }}
                        >
                          <FaTrash
                            size={14}
                            color={appTheme[currentUser.theme].text_4}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )
            )}
        </div>
      )}
    </form>
  );
};

export default ModuleSettings;
