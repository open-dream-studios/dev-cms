"use client";
import { useContext, useEffect } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext";
import { useModulesForm } from "@/hooks/useModulesForm";
import { ModuleFormData } from "@/util/schemas/moduleSchema";
import { appTheme } from "@/util/appTheme";
import { FaPlus, FaRegCircleCheck, FaTrash } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { FiEdit } from "react-icons/fi";
import { useState } from "react";
import { Module } from "@/types/project";
import Modal2Continue from "@/modals/Modal2Continue";
import { useModal2Store } from "@/store/useModalStore";

const EditModules = () => {
  const { currentUser } = useContext(AuthContext);
  const { modules, upsertModule, deleteModule, isLoadingModules } =
    useContextQueries();

  const modal2 = useModal2Store((state: any) => state.modal2);
  const setModal2 = useModal2Store((state: any) => state.setModal2);

  const [editingModule, setEditingModule] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const form = useModulesForm();

  useEffect(() => {
    if (showForm) {
      form.setFocus("name");
    }
  }, [showForm, form]);

  if (!currentUser) return null;

  const onSubmit = async (data: ModuleFormData) => {
    await upsertModule({
      id: editingModule || undefined,
      name: data.name,
      description: data.description,
      identifier: data.identifier,
      config_schema: configKeys,
    });
    setEditingModule(null);
    setShowForm(false);
    setConfigKeys([]);
    form.reset();
  };

  const handleShowForm = () => {
    form.reset({
      name: "",
      description: "",
      identifier: "",
    });
    setShowForm(true);
    setEditingModule(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingModule(null);
    form.reset();
    setNewKey("");
  };

  const handleDeleteModule = async (mod: Module) => {
    if (!currentUser) return null;
    setModal2({
      ...modal2,
      open: !modal2.open,
      showClose: false,
      offClickClose: true,
      width: "w-[300px]",
      maxWidth: "max-w-[400px]",
      aspectRatio: "aspect-[5/2]",
      borderRadius: "rounded-[12px] md:rounded-[15px]",
      content: (
        <Modal2Continue
          text={"Delete module " + mod.name + "?"}
          onContinue={() => deleteModule(mod.id)}
          threeOptions={false}
        />
      ),
    });
  };

  const [configKeys, setConfigKeys] = useState<string[]>([]);
  const [newKey, setNewKey] = useState("");

  const handleAddKey = () => {
    if (newKey.trim() && !configKeys.includes(newKey.trim())) {
      setConfigKeys([...configKeys, newKey.trim()]);
      setNewKey("");
    }
  };

  const handleDeleteKey = (key: string) => {
    setConfigKeys(configKeys.filter((k) => k !== key));
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="w-full flex flex-col gap-[8px] px-[50px] py-[33px] h-[100%] overflow-y-scroll"
    >
      <div className="flex flex-row gap-[12px] items-center mb-[8px]">
        <h2 className="text-[30px] font-bold mt-[-5px]">Modules</h2>
        {showForm ? (
          <div className="flex gap-[9px]">
            <button
              type="submit"
              style={{
                backgroundColor:
                  appTheme[currentUser.theme].background_2_selected,
              }}
              className="cursor-pointer hover:brightness-75 dim flex items-center gap-2 pl-[15px] pr-[18px]  py-[6px] rounded-full"
            >
              <FaRegCircleCheck /> Save
            </button>
            <button
              onClick={handleCancelForm}
              style={{
                backgroundColor:
                  appTheme[currentUser.theme].background_2_selected,
              }}
              className="cursor-pointer hover:brightness-75 dim flex items-center gap-[4px] pl-[13px] pr-[19px] py-[6px] rounded-full"
            >
              <IoClose size={19} /> Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handleShowForm}
            style={{
              backgroundColor:
                appTheme[currentUser.theme].background_2_selected,
            }}
            className="flex items-center justify-center w-[36px] h-[36px] rounded-full dim hover:brightness-75 cursor-pointer"
          >
            <FaPlus size={17} color={appTheme[currentUser.theme].text_4} />
          </button>
        )}
      </div>

      {showForm && (
        <div
          style={{
            backgroundColor: appTheme[currentUser.theme].background_1_2,
          }}
          className="flex justify-between items-center rounded-[10px] px-[20px] py-[10px]"
        >
          <div className="w-[100%]">
            <p className="font-semibold">
              <input
                {...form.register("name")}
                placeholder="Name..."
                className="input outline-none rounded px-2 py-1 w-[100%] text-[17px]"
              />
            </p>
            <p
              style={{ color: appTheme[currentUser.theme].text_4 }}
              className="text-sm"
            >
              <input
                {...form.register("description")}
                placeholder="Description..."
                className="input outline-none px-2 py-1 w-[100%]"
              />
            </p>

            <p
              style={{ color: appTheme[currentUser.theme].text_4 }}
              className="text-sm"
            >
              <input
                {...form.register("identifier")}
                placeholder="Identifier..."
                className="input outline-none px-2 py-1 w-[100%]"
              />
            </p>

            <div className="mt-4 px-2">
              <p className="font-semibold text-[17px] mb-[6px]">
                Accepted Keys
              </p>

              {configKeys.length > 0 && (
                <div className="flex flex-wrap gap-2 my-1">
                  {configKeys.map((key) => (
                    <div
                      key={key}
                      className="flex items-center gap-2 px-3 py-1 mt-[3px] mb-[1px] rounded-full text-sm"
                      style={{
                        backgroundColor:
                          appTheme[currentUser.theme].background_2_selected,
                        color: appTheme[currentUser.theme].text_4,
                      }}
                    >
                      {key}
                      <button
                        onClick={() => handleDeleteKey(key)}
                        className="ml-1 text-xs hover:brightness-75 dim cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="Add a key..."
                  className="outline-none input py-[6px] rounded-[5px] text-[14px] flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddKey}
                  style={{
                    backgroundColor: appTheme[currentUser.theme].background_2_2,
                  }}
                  className="hover:brightness-90 dim cursor-pointer w-[80px] rounded-full h-[30px] text-sm "
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!editingModule && (
        <div className="flex flex-col gap-2">
          {isLoadingModules ? (
            <p>Loading...</p>
          ) : (
            modules.map((mod: Module) => (
              <div
                key={mod.id}
                style={{
                  backgroundColor: appTheme[currentUser.theme].background_1_2,
                }}
                className="flex justify-between items-center rounded-[10px] px-[20px] py-[10px]"
              >
                <div className="w-[calc(100%-90px)] truncate">
                  <p className="font-semibold truncate">{mod.name}</p>
                  <p
                    style={{ color: appTheme[currentUser.theme].text_4 }}
                    className="text-sm truncate"
                  >
                    {mod.identifier} | {mod.description}
                  </p>
                </div>

                {!showForm && (
                  <div className="flex flex-row gap-[8px]">
                    <button
                      onClick={() => {
                        setEditingModule(mod.id);
                        form.reset({
                          name: mod.name,
                          description: mod.description || "",
                          identifier: mod.identifier || "",
                        });
                        setConfigKeys(mod.config_schema || []);
                        setShowForm(true);
                      }}
                      style={{
                        backgroundColor:
                          appTheme[currentUser.theme].background_2_selected,
                      }}
                      className="flex items-center justify-center w-[36px] h-[36px] hover:brightness-75 dim cursor-pointer rounded-full"
                    >
                      <FiEdit
                        size={18}
                        color={appTheme[currentUser.theme].text_4}
                      />
                    </button>

                    <button
                      onClick={() => handleDeleteModule(mod)}
                      style={{
                        backgroundColor:
                          appTheme[currentUser.theme].background_2_selected,
                      }}
                      className="flex items-center justify-center w-[36px] h-[36px] hover:brightness-75 dim cursor-pointer rounded-full"
                    >
                      <FaTrash
                        size={15}
                        color={appTheme[currentUser.theme].text_4}
                      />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </form>
  );
};

export default EditModules;
