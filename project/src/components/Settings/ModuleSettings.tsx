// project/src/components/Settings/ModuleSettings.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext";
import { Integration, Module, ProjectModule } from "@/types/project";
import { appTheme } from "@/util/appTheme";
import { useContext, useEffect, useState } from "react";
import { FaCheck, FaPlus, FaRegCircleCheck, FaTrash } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { useProjectContext } from "@/contexts/projectContext";
import { useIntegrationForm } from "@/hooks/useIntegrationForm";
import { IntegrationFormData } from "@/util/schemas/integrationSchema";
import { makeRequest } from "@/util/axios";
import { BiChevronLeft } from "react-icons/bi";
import { GoChevronLeft } from "react-icons/go";
import { MdChevronLeft } from "react-icons/md";

type IntegrationConfig = Record<string, string>;

const ModuleSettings = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentProject } = useProjectContext();
  const {
    projectModules,
    deleteProjectModule,
    addProjectModule,
    modules,
    integrations,
    upsertIntegration,
    deleteIntegrationKey,
  } = useContextQueries();
  if (!currentUser || !currentProject) return null;

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

  const handleProjectModuleClick = (projectModule: ProjectModule) => {
    setSelectedProjectModule(projectModule);
    setSelectedModule(projectModule.module_id);
  };

  const [selectedProjectModule, setSelectedProjectModule] =
    useState<ProjectModule | null>(null);

  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [integrationConfig, setIntegrationConfig] = useState<IntegrationConfig>(
    {}
  );
  const [showAddKeyInput, setShowAddKeyInput] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const form = useIntegrationForm();

  const onSubmit = async (data: IntegrationFormData) => {
    if (!selectedModule || !currentProject) return;
    if (integrationConfig[data.key] !== undefined) {
      alert("That key already exists. Please use a unique key.");
      return;
    }
    const newConfig = { ...integrationConfig, [data.key]: data.value };
    try {
      await upsertIntegration({
        project_idx: currentProject.id,
        module_id: selectedModule,
        config: newConfig,
      });
      setIntegrationConfig(newConfig);
      setShowAddKeyInput(false);
      form.reset();
    } catch (err) {
      console.error("Failed to save integration:", err);
    }
  };

  useEffect(() => {
    if (!selectedModule || !currentProject) return;
    (async () => {
      try {
        const res = await makeRequest.post("/api/integrations", {
          project_idx: currentProject.id,
        });
        const integration = res.data.integrations.find(
          (i: Integration) => i.module_id === selectedProjectModule?.module_id
        );
        setIntegrationConfig(integration?.config || {});
      } catch {
        setIntegrationConfig({});
      }
    })();
  }, [selectedModule, currentProject]);

  if (!currentUser || !currentProject) return null;

  const handleAddKey = () => {
    if (newKey && newValue) {
      setIntegrationConfig({ ...integrationConfig, [newKey]: newValue });
    }
  };

  const handleDeleteIntegration = async (key: string) => {
    if (!selectedModule) return;
    await deleteIntegrationKey({
      project_idx: currentProject.id,
      module_id: selectedModule,
      key,
    });
  };

  const handleBackClick = () => {
    setSelectedProjectModule(null);
    setSelectedModule(null);
    setIntegrationConfig({});
    setShowAddKeyInput(false);
    form.reset();
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="ml-[5px] md:ml-[8px] w-full h-full flex flex-col pt-[50px]"
    >
      <div className="ml-[1px] flex flex-row gap-[13.5px] items-center lg:mb-[12px] mb-[11px] w-[90%]">
        {selectedProjectModule !== null && (
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
        <p className="font-[600] h-[40px] text-[29px] leading-[33px] md:text-[32px] md:leading-[36px]">
          {selectedProjectModule ? selectedProjectModule.name : "Modules"}
        </p>
        {currentProject !== null && (
          <div
            className={`relative ${
              selectedProjectModule !== null &&
              "flex-1 flex justify-end pr-[5px]"
            }`}
          >
            {showAddKeyInput ? (
              <div className="flex flex-row gap-[11.5px]">
                <button
                  onClick={handleAddKey}
                  className="select-none dim hover:brightness-75 cursor-pointer text-[15px] h-[36px] rounded-full mt-[-0.4px] flex justify-center items-center gap-[9px] pl-[16px] pr-[15px]"
                  style={{
                    backgroundColor: appTheme[currentUser.theme].background_1_2,
                    color: appTheme[currentUser.theme].text_3,
                  }}
                >
                  <p className=" mt-[-1.5px]">Save</p>
                  <FaRegCircleCheck size={16} className="mt-[1px]" />
                </button>
                <div
                  className="select-none dim hover:brightness-75 cursor-pointer text-[14.5px] h-[36px] mt-[-0.6px] rounded-full flex justify-center items-center gap-[6px] pl-[16px] pr-[15px]"
                  style={{
                    backgroundColor: appTheme[currentUser.theme].background_1_2,
                    color: appTheme[currentUser.theme].text_3,
                  }}
                  onClick={() => setShowAddKeyInput(false)}
                >
                  <p className=" mt-[-0.5px]">Cancel</p>
                  <IoClose size={19} className="mt-[1px]" />
                </div>
              </div>
            ) : (
              <div
                onClick={() =>
                  selectedProjectModule === null
                    ? setAddingModules(true)
                    : setShowAddKeyInput(true)
                }
                className="dim hover:brightness-75 cursor-pointer w-[36px] h-[36px] rounded-full flex justify-center items-center"
                style={{
                  backgroundColor: appTheme[currentUser.theme].background_1_2,
                }}
              >
                <FaPlus size={14} />
              </div>
            )}

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
                      currentUser.theme === "dark" ? "#2E2D2D" : "#EFEFEF",
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
                        <span className="w-[100%] truncate">{m.name}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {selectedProjectModule === null ? (
        <div
          className="w-[90%] max-h-[305px] overflow-y-scroll rounded-[8px]"
          style={{
            backgroundColor: appTheme[currentUser.theme].background_1_2,
          }}
        >
          {currentProject !== null &&
            projectModules.map(
              (projectModule: ProjectModule, index: number) => {
                return (
                  <div key={index} className="w-[100%] relative">
                    {(index !== 0 || showAddKeyInput) && (
                      <div
                        style={{
                          backgroundColor: appTheme[currentUser.theme].text_4,
                        }}
                        className="w-[100%] h-[1px] rounded-[2px] opacity-[0.5]"
                      />
                    )}
                    <div
                      onClick={() => handleProjectModuleClick(projectModule)}
                      style={{ color: appTheme[currentUser.theme].text_4 }}
                      className="group cursor-pointer w-full h-[50px] text-[15.5px] leading-[22px] font-[400] flex flex-row items-center justify-between px-[20px]"
                    >
                      <p className="transition dim group-hover:brightness-75 group-has-[button:hover]:brightness-100">
                        {projectModule.name}
                      </p>

                      <button
                        onClick={() => handleDeleteProjectModule(projectModule)}
                        style={{
                          backgroundColor:
                            appTheme[currentUser.theme].background_2_selected,
                        }}
                        className="cursor-pointer flex items-center justify-center w-[32px] h-[32px] hover:brightness-[84%] dim rounded-full"
                      >
                        <FaTrash
                          size={14}
                          color={appTheme[currentUser.theme].text_4}
                        />
                      </button>
                    </div>
                  </div>
                );
              }
            )}
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
              <div
                style={{ color: appTheme[currentUser.theme].text_4 }}
                className="relative w-[100%] h-[50px] text-[15.5px] leading-[22px] gap-[10px] font-[400] flex flex-row items-center justify-between px-[20px]"
              >
                <input
                  {...form.register("key")}
                  onChange={(e) => {
                    form.setValue("key", e.target.value, {
                      shouldValidate: false,
                    });
                    form.clearErrors("key");
                  }}
                  placeholder="Key..."
                  className="outline-none w-[50%] input py-[6px] rounded-[5px] text-[14px]"
                />
                <input
                  {...form.register("value")}
                  onChange={(e) => {
                    form.setValue("value", e.target.value, {
                      shouldValidate: false,
                    });
                    form.clearErrors("value");
                  }}
                  placeholder="Value..."
                  className="outline-none input w-[50%] py-[6px] rounded-[5px] text-[14px]"
                />
                {form.formState.isSubmitted && form.formState.errors.key && (
                  <div
                    className="absolute z-[352] right-[96px] top-[9.5px] py-[8px] text-[16px] px-[11px] rounded-[6px]"
                    style={{
                      backgroundColor:
                        appTheme[currentUser.theme].background_1_2,
                    }}
                  >
                    <p className="text-red-500 text-xs">
                      {form.formState.errors.key?.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {integrations
            .filter((i) => i.module_id === selectedProjectModule.module_id)
            .map((integration: Integration, index: number) => (
              <div key={index}>
                {Object.entries(integration.config).map(
                  ([k, v], keyIndex: number) => (
                    <div key={k} className="w-[100%] relative">
                      {(!(keyIndex === 0 && index === 0) ||
                        showAddKeyInput) && (
                        <div
                          style={{
                            backgroundColor: appTheme[currentUser.theme].text_4,
                          }}
                          className="w-[100%] h-[1px] rounded-[2px] opacity-[0.5]"
                        />
                      )}
                      <div className="relative w-[100%] flex justify-between items-center">
                        <div
                          key={k}
                          style={{ color: appTheme[currentUser.theme].text_4 }}
                          className="relative w-[100%] h-[50px] text-[14px] leading-[22px] gap-[10px] font-[400] flex flex-row items-center justify-between px-[20px]"
                        >
                          <p className="w-[50%] truncate">{k}</p>
                          <p className="w-[50%] pr-[34px] truncate">{v}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteIntegration(k)}
                          style={{
                            backgroundColor:
                              appTheme[currentUser.theme].background_2_selected,
                          }}
                          className="absolute top-[9px] right-[12px] cursor-pointer flex items-center justify-center w-[32px] h-[32px] hover:brightness-[84%] dim rounded-full"
                        >
                          <FaTrash
                            size={14}
                            color={appTheme[currentUser.theme].text_4}
                          />
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            ))}
        </div>
      )}
    </form>
  );
};

export default ModuleSettings;
