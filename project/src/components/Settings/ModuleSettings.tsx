// project/src/components/Settings/ModuleSettings.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import {
  Integration,
  ModuleDefinitionTree,
  ProjectModule,
} from "@open-dream/shared";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { FaCheck, FaPlus, FaRegCircleCheck, FaTrash } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { useIntegrationForm } from "@/hooks/forms/useIntegrationForm";
import { IntegrationFormData } from "@/util/schemas/integrationSchema";
import { MdChevronLeft } from "react-icons/md";
import { HiLockClosed } from "react-icons/hi2";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useCurrentTheme } from "@/hooks/useTheme";
import {
  cleanModuleIdentifier,
  getModulesStructureKeys,
  nodeHasChildren,
} from "@/util/functions/Modules";
import { FaPollH } from "react-icons/fa";
import { FiEdit } from "react-icons/fi";

const ModuleSettings = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentProject, currentProjectId } = useCurrentDataStore();
  const {
    projectModules,
    deleteProjectModule,
    upsertProjectModule,
    moduleDefinitionTree,
    integrations,
    upsertIntegration,
    deleteIntegration,
  } = useContextQueries();
  const currentTheme = useCurrentTheme();

  const [addingModules, setAddingModules] = useState(false);
  const [checkedModules, setCheckedModules] = useState<Set<string>>(new Set());
  const [path, setPath] = useState<ModuleDefinitionTree[]>([]);
  const [keysEditor, setKeysEditor] = useState<boolean>(false);

  const [showAddKeyInput, setShowAddKeyInput] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");

  const [unsetIntegrations, setUnsetIntegrations] = useState<string[]>([]);

  const form = useIntegrationForm();

  useEffect(() => {
    if (!projectModules) return;
    const ids = new Set(
      projectModules
        .map((pm) => pm.module_identifier)
        .filter((x): x is string => !!x)
    );
    setCheckedModules(ids);
  }, [projectModules]);

  useEffect(() => {
    if (!moduleDefinitionTree || !Object.keys(moduleDefinitionTree).length)
      return;

    const run = async () => {
      const allKeys = await getModulesStructureKeys(moduleDefinitionTree);
      setUnsetIntegrations(
        allKeys
          .filter(
            (key: string) =>
              !integrations.some(
                (integration: Integration) =>
                  integration.integration_key === key
              )
          )
          .sort()
      );
    };

    run();
  }, [integrations, moduleDefinitionTree]);

  const handleModuleOptionClick = (identifier: string) => {
    if (!currentProjectId) return;
    if (checkedModules.has(identifier)) {
      const matchedModule = projectModules.find(
        (mod: ProjectModule) => mod.module_identifier === identifier
      );
      if (matchedModule && matchedModule.module_id) {
        deleteProjectModule(matchedModule.module_id);
      }
    } else {
      upsertProjectModule({
        module_id: null,
        module_identifier: identifier,
        project_idx: currentProjectId,
        settings: null,
        required_access: 1,
        frontend_visible: true,
      } as ProjectModule);
    }
  };

  const handleDeleteProjectModule = async (identifier: string) => {
    const matchedModule = projectModules.find(
      (projectModule: ProjectModule) =>
        projectModule.module_identifier === identifier
    );
    if (matchedModule && matchedModule.module_id) {
      await deleteProjectModule(matchedModule.module_id);
    }
  };

  const handleProjectModuleClick = (node: ModuleDefinitionTree) => {
    if (nodeHasChildren(node)) {
      setPath((prev) => [...prev, node]);
    }
  };

  const handleBackClick = () => {
    setPath((prev) => prev.slice(0, -1));
  };

  const selectableModules = useMemo(() => {
    if (!moduleDefinitionTree) return [];
    if (path.length === 0) {
      return (
        moduleDefinitionTree.children?.filter(
          (m: ModuleDefinitionTree) => !/^m\.(ts|js)$/.test(m.name)
        ) ?? []
      );
    }
    return (
      path[path.length - 1].children?.filter(
        (m: ModuleDefinitionTree) => !/^m\.(ts|js)$/.test(m.name)
      ) ?? []
    );
  }, [path, moduleDefinitionTree]);

  const activeModules = useMemo(() => {
    return selectableModules.filter((m: ModuleDefinitionTree) =>
      projectModules.some(
        (pm: ProjectModule) => pm.module_identifier === m.name
      )
    );
  }, [projectModules, selectableModules]);

  const onSubmit = async (data: IntegrationFormData) => {
    try {
      await saveIntegration(data.key, data.value);
      form.reset();
    } catch (err) {
      console.error("Failed to save integration:", err);
    }
  };

  const saveIntegration = async (key: string, value: string | null) => {
    if (!currentProjectId) return;
    if (
      showAddKeyInput &&
      integrations.filter((i: Integration) => i.integration_key === key)
        .length > 0
    ) {
      alert("That key is already defined for this module");
      return;
    }

    const res = await upsertIntegration({
      integration_id: editingKey ? editingKey : null,
      project_idx: currentProjectId,
      integration_key: key,
      integration_value: value,
    } as Integration);
    if (!res.success) {
      if (res.message) {
        alert(res.message);
      }
    } else {
      setShowAddKeyInput(false);
      setEditingKey(null);
    }
  };

  const handleDeleteIntegration = async (integration_id: string | null) => {
    if (integration_id) {
      await deleteIntegration(integration_id);
    }
  };

  const addNewKey = (newKey: string | null) => {
    setShowAddKeyInput(true);
    if (newKey) {
      form.setValue("key", newKey);
      setTimeout(() => {
        editValueInputRef.current?.focus();
      }, 50);
    } else {
      form.setValue("key", "");
      setTimeout(() => {
        editKeyInputRef.current?.focus();
      }, 50);
    }
    form.setValue("value", "");
  };

  const editKeyInputRef = useRef<HTMLInputElement>(null);
  const editValueInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser || !currentProject) return null;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="ml-[5px] md:ml-[8px] w-full h-full flex flex-col pt-[50px]"
    >
      <div className="ml-[1px] flex flex-row gap-[13.5px] items-center mb-[12px] w-[90%]">
        {path.length !== 0 && (
          <div
            onClick={handleBackClick}
            className="dim hover:brightness-75 cursor-pointer w-[36px] h-[36px] rounded-full flex justify-center items-center"
            style={{
              backgroundColor: currentTheme.background_1_2,
            }}
          >
            <MdChevronLeft
              size={29}
              color={currentTheme.text_2}
              className="ml-[-2px] mt-[-1px] opacity-[80%]"
            />
          </div>
        )}
        <p className="font-[600] h-[40px] truncate text-[29px] leading-[33px]">
          {keysEditor
            ? "Keys"
            : path.length === 0
            ? "Modules"
            : path[path.length - 1].name}
        </p>

        <div className="relative flex-1 flex">
          {keysEditor ? (
            showAddKeyInput ? (
              <div className="flex gap-[11.5px]">
                <button
                  type="submit"
                  className="dim cursor-pointer text-[15px] h-[36px] rounded-full flex items-center gap-[9px] px-[15px]"
                  style={{
                    backgroundColor: currentTheme.background_1_2,
                    color: currentTheme.text_3,
                  }}
                >
                  Save <FaRegCircleCheck size={16} />
                </button>
                <div
                  onClick={() => setShowAddKeyInput(false)}
                  className="dim cursor-pointer text-[14.5px] h-[36px] rounded-full flex items-center gap-[6px] px-[15px]"
                  style={{
                    backgroundColor: currentTheme.background_1_2,
                    color: currentTheme.text_3,
                  }}
                >
                  Cancel <IoClose size={19} />
                </div>
              </div>
            ) : (
              <div
                onClick={() => addNewKey(null)}
                className="dim hover:brightness-[85%] cursor-pointer w-[36px] h-[36px] rounded-full flex justify-center items-center"
                style={{
                  backgroundColor: currentTheme.background_1_2,
                }}
              >
                <FaPlus size={14} />
              </div>
            )
          ) : (
            <div
              onClick={() => setAddingModules(true)}
              className="dim hover:brightness-[85%] cursor-pointer w-[36px] h-[36px] rounded-full flex justify-center items-center"
              style={{
                backgroundColor: currentTheme.background_1_2,
              }}
            >
              <FaPlus size={14} />
            </div>
          )}

          {addingModules && !keysEditor && (
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
                {selectableModules.map((m: ModuleDefinitionTree) => {
                  const checked = checkedModules.has(m.name);

                  return (
                    <div
                      key={m.name}
                      onClick={() => handleModuleOptionClick(m.name)}
                      className="flex items-center py-[1.5px] cursor-pointer hover:brightness-70 dim text-[15.5px]"
                    >
                      <div className="w-[18.9px]">
                        {checked && <FaCheck size={12} />}
                      </div>
                      <span className="truncate">
                        {cleanModuleIdentifier(m.name)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div
          onClick={() => setKeysEditor((prev) => !prev)}
          className="dim hover:brightness-[85%] cursor-pointer px-[17px] flex flex-row gap-[8px] h-[36px] rounded-full justify-center items-center"
          style={{
            backgroundColor: currentTheme.background_1_2,
          }}
        >
          {keysEditor ? (
            <FaPollH size={14} className="opacity-[0.7]" />
          ) : (
            <HiLockClosed size={14} className="opacity-[0.7]" />
          )}

          <p className="font-[600] opacity-[0.84]">
            {keysEditor ? "Modules" : "Keys"}
          </p>
        </div>
      </div>

      {!keysEditor ? (
        <div
          className="w-[90%] max-h-[305px] overflow-y-scroll rounded-[8px]"
          style={{
            backgroundColor: currentTheme.background_1_2,
          }}
        >
          {activeModules.map((m: ModuleDefinitionTree, index: number) => {
            return (
              <div key={m.name} className="w-[100%] relative">
                {index !== 0 && (
                  <div
                    style={{
                      backgroundColor: currentTheme.text_4,
                    }}
                    className="w-[100%] h-[1px] opacity-50"
                  />
                )}
                <div
                  onClick={() => handleProjectModuleClick(m)}
                  className={`${
                    nodeHasChildren(m) && "cursor-pointer"
                  } group w-[100%] h-[50px] flex justify-between items-center px-[20px]`}
                  style={{ color: currentTheme.text_4 }}
                >
                  <p
                    className={`${
                      nodeHasChildren(m) && "group-hover:brightness-75"
                    } truncate dim w-[calc(100%-85px)]`}
                  >
                    {cleanModuleIdentifier(m.name)}
                  </p>
                  <div className="flex gap-[11px]">
                    <div
                      onClick={(e) => handleDeleteProjectModule(m.name)}
                      className="flex items-center justify-center w-[33px] h-[33px] rounded-full dim cursor-pointer"
                      style={{
                        backgroundColor: currentTheme.background_2_selected,
                      }}
                    >
                      <FaTrash size={14} color={currentTheme.text_4} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="w-[90%] max-h-[305px] overflow-y-scroll rounded-[8px]"
          style={{
            backgroundColor: currentTheme.background_1_2,
          }}
        >
          {showAddKeyInput && (
            <div
              className="w-[100%]"
              style={{
                backgroundColor: currentTheme.background_2_2,
              }}
            >
              <div className="flex gap-[10px] px-[20px] h-[50px] items-center">
                <input
                  value={form.watch("key") || ""}
                  onChange={(e) => form.setValue("key", e.target.value)}
                  ref={editKeyInputRef}
                  placeholder="Key..."
                  className="outline-none w-[50%] input py-[6px] rounded-[5px] text-[14px]"
                />
                <input
                  ref={editValueInputRef}
                  value={form.watch("value") || ""}
                  onChange={(e) => form.setValue("value", e.target.value)}
                  placeholder="Value..."
                  className="outline-none w-[50%] input py-[6px] rounded-[5px] text-[14px]"
                />
              </div>
            </div>
          )}

          {integrations.map((i: Integration, index: number) => {
            return (
              <div key={index}>
                {editingKey === i.integration_id ? (
                  <div
                    key={i.integration_key}
                    className="w-full flex px-[20px] h-[50px] items-center gap-[10px]"
                  >
                    <input
                      value={i.integration_key}
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
                        await saveIntegration(i.integration_key, tempValue);
                      }}
                      className="cursor-pointer hover:brightness-90 dim px-[12px] h-[32px] rounded-full text-sm dim"
                      style={{
                        backgroundColor: currentTheme.background_2_selected,
                        color: currentTheme.text_4,
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingKey(null)}
                      className="cursor-pointer hover:brightness-90 dim px-[12px] h-[32px] rounded-full text-sm dim"
                      style={{
                        backgroundColor: currentTheme.background_2_selected,
                        color: currentTheme.text_4,
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div key={i.integration_id} className="w-full relative">
                      <div className="flex justify-between items-center px-[20px] h-[50px] text-[14.5px]">
                        <p className="w-[40%] pr-[5px] truncate opacity-[50%]">
                          {i.integration_key}
                        </p>
                        <p className="flex-1 pr-[69px] truncate opacity-[50%]">
                          {"xxxxxxxxxxxxxxxx"}
                        </p>
                        <div className="absolute right-[12px] top-[9px] flex gap-[10px]">
                          <div
                            onClick={() => {
                              setEditingKey(i.integration_id);
                              setTempValue("");
                              setTimeout(() => {
                                if (editKeyInputRef.current) {
                                  editKeyInputRef.current.focus();
                                }
                              }, 20);
                            }}
                            className="flex items-center justify-center w-[32px] h-[32px] rounded-full dim cursor-pointer"
                            style={{
                              backgroundColor:
                                currentTheme.background_2_selected,
                            }}
                          >
                            <FiEdit size={16} color={currentTheme.text_4} />
                          </div>
                          <div
                            onClick={() =>
                              handleDeleteIntegration(i.integration_id)
                            }
                            className="flex items-center justify-center w-[32px] h-[32px] rounded-full dim cursor-pointer"
                            style={{
                              backgroundColor:
                                currentTheme.background_2_selected,
                            }}
                          >
                            <FaTrash size={14} color={currentTheme.text_4} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {keysEditor &&
        unsetIntegrations.map((i: string, index: number) => {
          return (
            <div key={index} className="w-[90%] relative opacity-[0.5]">
              {index !== 0 && (
                <div
                  className="w-[100%] h-[1px] rounded-[3px] opacity-[0.5]"
                  style={{ backgroundColor: currentTheme.background_4 }}
                />
              )}
              <div
                onClick={() => addNewKey(i)}
                className="w-[100%] group cursor-pointer flex items-center px-[20px] h-[50px] text-[14.5px]"
              >
                <p className="group-hover:brightness-75 dim pr-[5px] opacity-[50%]">
                  {i}
                </p>
              </div>
            </div>
          );
        })}
    </form>
  );
};

export default ModuleSettings;
