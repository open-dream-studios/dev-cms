// project/src/screens/AdminHome/AdminControllers/DefinitionsController.tsx
"use client";
import { useContext, useMemo } from "react";
import { AuthContext } from "@/contexts/authContext";
import {
  FaChevronLeft,
  FaPlus,
  FaRegCircleCheck,
  FaTrash,
} from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { FiEdit } from "react-icons/fi";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import {
  DefinitionItem,
  useAdminControllersUIStore,
} from "./_store/adminControllers.store";
import {
  definitionAdapters, 
  handleAdminControllerBackClick,
  handleCancelAdminControllerForm,
  handleDefinitionClick,
  handleDeleteDefinition,
  handleEditDefinitionClick,
  handleShowDefinitionForm,
} from "./_actions/adminControllers.actions";
import { capitalizeFirstLetter } from "@/util/functions/Data";

type DefinitionControl = keyof typeof definitionAdapters;

const DefinitionsController = ({ control }: { control: DefinitionControl }) => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const adapter = definitionAdapters[control];
  const form = adapter.useForm();
  const { definitions, isLoading } = adapter.useDefinitions();

  const { showForm, editingDefinition, selectedDefinition } =
    useAdminControllersUIStore();

  const filteredDefinitions = useMemo(() => {
    return definitions.filter((def: DefinitionItem) =>
      adapter.isParent(def, selectedDefinition)
    );
  }, [definitions, selectedDefinition, adapter]);

  if (!currentUser) return null;

  return (
    <form
      onSubmit={form.handleSubmit((data) => adapter.submit(form, data))}
      className="w-full flex flex-col gap-[8px] h-[100%] overflow-y-scroll"
    >
      <div className="flex flex-row gap-[5px] items-center mb-[8px] justify-center">
        {selectedDefinition && (
          <div
            onClick={() => handleAdminControllerBackClick(form)}
            className="cursor-pointer mt-[-2px] dim hover:brightness-75 flex items-center justify-center h-[33px] rounded-full w-[33px] opacity-[30%]"
          >
            <FaChevronLeft size={22} color={currentTheme.text_3} />
          </div>
        )}
         
        <h2 className="text-[24px] ml-[4px] font-bold mt-[-5px] mr-[14px]">
          {selectedDefinition
            ? selectedDefinition.type
            : `${capitalizeFirstLetter(control)} Definitions`}
        </h2>
        {showForm ? (
          <div className="flex gap-[9px]">
            <button
              type="submit"
              style={{
                backgroundColor: currentTheme.background_2_selected,
              }}
              className="cursor-pointer hover:brightness-75 dim flex items-center gap-2 pl-[15px] pr-[18px] py-[6px] rounded-full"
            >
              <FaRegCircleCheck /> Save
            </button>
            <button
              type="button"
              onClick={() => handleCancelAdminControllerForm(form)}
              style={{
                backgroundColor: currentTheme.background_2_selected,
              }}
              className="cursor-pointer hover:brightness-75 dim flex items-center gap-[4px] pl-[13px] pr-[19px] py-[6px] rounded-full"
            >
              <IoClose size={19} /> Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              handleShowDefinitionForm(form);
            }}
            style={{
              backgroundColor: currentTheme.background_2_selected,
            }}
            className="flex items-center justify-center w-[33px] h-[33px] rounded-full dim hover:brightness-75 cursor-pointer"
          >
            <FaPlus size={16} color={currentTheme.text_4} />
          </button>
        )}
      </div>

      {showForm && (
        <div
          style={{
            backgroundColor: currentTheme.background_1_2,
          }}
          className="flex justify-between items-center rounded-[10px] px-[20px] py-[10px]"
        >
          <div className="w-full">
            <input
              {...form.register("type")}
              placeholder="Type..."
              className="input outline-none rounded px-2 py-1 w-full text-[17px]"
            />
            <input
              {...form.register("identifier")}
              placeholder="Identifier..."
              className="input outline-none px-2 py-1 w-full mt-2"
            />
            <input
              {...form.register("description")}
              placeholder="Description..."
              className="input outline-none px-2 py-1 w-full mt-2"
            />
          </div>
        </div>
      )}

      {!editingDefinition && !showForm && (
        <div className="flex flex-col gap-2">
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            filteredDefinitions.map((definition: DefinitionItem) => (
              <div
                key={definition.id}
                style={{
                  backgroundColor: currentTheme.background_1_2,
                }}
                className={`${
                  selectedDefinition === null &&
                  "hover:brightness-[88%] dim cursor-pointer"
                } flex justify-between items-center rounded-[10px] px-[20px] py-[10px]`}
                onClick={() => handleDefinitionClick(definition)}
              >
                <div className="w-[calc(100%-90px)] truncate">
                  <p className="font-semibold truncate">{definition.type}</p>
                  <p
                    style={{ color: currentTheme.text_4 }}
                    className="text-sm truncate"
                  >
                    {definition.identifier}
                  </p>
                </div>
                {!showForm && (
                  <div className="flex flex-row gap-[8px]">
                    <div
                      onClick={(e) =>
                        handleEditDefinitionClick(e, definition, form)
                      }
                      style={{
                        backgroundColor: currentTheme.background_2_selected,
                      }}
                      className="flex items-center justify-center w-[36px] h-[36px] hover:brightness-90 dim cursor-pointer rounded-full"
                    >
                      <FiEdit size={18} color={currentTheme.text_4} />
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDefinition(definition);
                      }}
                      style={{
                        backgroundColor: currentTheme.background_2_selected,
                      }}
                      className="flex items-center justify-center w-[36px] h-[36px] hover:brightness-90 dim cursor-pointer rounded-full"
                    >
                      <FaTrash size={15} color={currentTheme.text_4} />
                    </div>
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

export default DefinitionsController;
