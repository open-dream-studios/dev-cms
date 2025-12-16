// project/src/screens/AdminHome/AdminControl/EditSectionDefinitions/EditSectionDefinitions.tsx
"use client";
import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import {
  FaChevronLeft,
  FaPlus,
  FaRegCircleCheck,
  FaTrash,
} from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { FiEdit } from "react-icons/fi";
import Modal2Continue from "@/modals/Modal2Continue";
import {
  SectionDefinition,
  FieldDefinition,
  SectionConfigSchema,
} from "@open-dream/shared";
import SchemaBuilder from "./SchemaBuilder";
import { toast } from "react-toastify";
import { useCurrentTheme } from "@/hooks/useTheme";
import { useUiStore } from "@/store/useUIStore";

const EditSectionDefinitions = () => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const {
    sectionDefinitions,
    upsertSectionDefinition,
    deleteSectionDefinition,
    isLoadingSectionDefinitions,
  } = useContextQueries();
  const { modal2, setModal2 } = useUiStore();

  const [selectedSection, setSelectedSection] =
    useState<SectionDefinition | null>(null);
  const [editingSection, setEditingSection] =
    useState<SectionDefinition | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [allowedElements, setAllowedElements] = useState<string[]>([]);
  const [newElement, setNewElement] = useState("");

  const [configSchema, setConfigSchema] = useState<SectionConfigSchema>({
    fields: [],
  });

  useEffect(() => {
    if (showForm) {
      setTimeout(() => {
        document.getElementById("section-name-input")?.focus();
      }, 50);
    }
  }, [showForm]);

  function validateUniqueKeys(
    fields: FieldDefinition[],
    path: string[] = []
  ): string[] {
    const errors: string[] = [];
    const seen = new Set<string>();

    for (const field of fields) {
      if (seen.has(field.key)) {
        errors.push(
          `Duplicate key "${field.key}" at ${path.join(".") || "root"}`
        );
      } else if (field.key) {
        seen.add(field.key);
      }

      // Recurse into containers
      if (field.type === "object" || field.type === "repeater") {
        errors.push(
          ...validateUniqueKeys((field as any).fields || [], [
            ...path,
            field.key,
          ])
        );
      }
    }
    return errors;
  }

  const onSubmit = async () => {
    const parentId = selectedSection ? selectedSection.id : null;
    const errors = validateUniqueKeys(configSchema.fields);
    if (errors.length === 0) {
      await upsertSectionDefinition({
        section_definition_id: editingSection
          ? editingSection.section_definition_id
          : null,
        name,
        identifier,
        allowed_elements: allowedElements,
        parent_section_definition_id: parentId,
        config_schema: configSchema,
      } as SectionDefinition);

      resetForm();
    } else {
      toast.error(errors[0]);
    }
  };

  const resetForm = () => {
    setEditingSection(null);
    setShowForm(false);
    setAllowedElements([]);
    setName("");
    setIdentifier("");
    setNewElement("");
    setConfigSchema({ fields: [] });
  };

  const handleShowForm = () => {
    resetForm();
    setConfigSchema({ fields: [] });
    setShowForm(true);
  };

  const handleDeleteSectionDef = (section: SectionDefinition) => {
    if (!section.section_definition_id) return;
    setModal2({
      ...modal2,
      open: !modal2.open,
      content: (
        <Modal2Continue
          text={`Delete section definition "${section.name}"?`}
          onContinue={() => {
            if (section.section_definition_id) {
              deleteSectionDefinition(section.section_definition_id);
            }
          }}
          threeOptions={false}
        />
      ),
    });
  };

  const handleEditClick = (
    e: React.MouseEvent,
    sectionDefinition: SectionDefinition
  ) => {
    e.stopPropagation();
    setEditingSection(sectionDefinition);
    setName(sectionDefinition.name);
    setIdentifier(sectionDefinition.identifier);
    setAllowedElements(sectionDefinition.allowed_elements || []);
    setConfigSchema(
      (sectionDefinition as any).config_schema &&
        (sectionDefinition as any).config_schema.fields
        ? (sectionDefinition as any).config_schema
        : { fields: [] }
    );
    setShowForm(true);
  };

  const handleSectionClick = (section: SectionDefinition) => {
    if (selectedSection === null) setSelectedSection(section);
  };

  const handleBackClick = () => {
    setSelectedSection(null);
    resetForm();
  };

  const handleAddElement = () => {
    if (newElement.trim() && !allowedElements.includes(newElement.trim())) {
      setAllowedElements([...allowedElements, newElement.trim()]);
      setNewElement("");
    }
  };

  const handleDeleteElement = (el: string) => {
    setAllowedElements(allowedElements.filter((s) => s !== el));
  };

  const filteredSections = useMemo(() => {
    return selectedSection === null
      ? sectionDefinitions.filter(
          (s) => s.parent_section_definition_id === null
        )
      : sectionDefinitions.filter(
          (s) => s.parent_section_definition_id === selectedSection.id
        );
  }, [sectionDefinitions, selectedSection]);

  if (!currentUser) return null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="w-full flex flex-col gap-[8px] h-[100%] overflow-y-scroll"
    >
      <div className="flex flex-row gap-[5px] items-center mb-[8px] justify-center">
        {selectedSection && (
          <div
            onClick={handleBackClick}
            className="cursor-pointer mt-[-2px] dim hover:brightness-75 flex items-center justify-center h-[33px] rounded-full w-[33px] opacity-[30%]"
          >
            <FaChevronLeft size={22} color={currentTheme.text_3} />
          </div>
        )}
        <h2 className="text-[24px] ml-[4px] font-bold mt-[-5px] mr-[14px]">
          {selectedSection ? selectedSection.name : "Section Types"}
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
              onClick={resetForm}
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
            onClick={handleShowForm}
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
          className="flex flex-col gap-4 justify-between items-center rounded-[10px] px-[20px] py-[14px]"
        >
          <div className="w-full">
            <input
              id="section-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Section name..."
              className="input outline-none rounded px-2 py-1 w-full text-[17px]"
            />
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Section identifier..."
              className="input outline-none px-2 py-1 w-full mt-2"
            />

            <div className="mt-4 px-2">
              <p className="font-semibold text-[17px] mb-[6px]">
                Allowed Elements
              </p>
              {allowedElements.length > 0 && (
                <div className="flex flex-wrap gap-2 my-1">
                  {allowedElements.map((s) => (
                    <div
                      key={s}
                      className="flex items-center gap-2 px-3 py-1 mt-[3px] mb-[1px] rounded-full text-sm"
                      style={{
                        backgroundColor: currentTheme.background_2_selected,
                        color: currentTheme.text_4,
                      }}
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => handleDeleteElement(s)}
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
                  value={newElement}
                  onChange={(e) => setNewElement(e.target.value)}
                  placeholder="Add an element..."
                  className="outline-none input py-[6px] rounded-[5px] text-[14px] flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddElement}
                  style={{
                    backgroundColor: currentTheme.background_2_2,
                  }}
                  className="hover:brightness-90 dim cursor-pointer w-[80px] rounded-full h-[30px] text-sm"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="mt-2">
              <p className="font-semibold text-[17px] mb-[6px]">
                Config Schema
              </p>
              <SchemaBuilder
                value={configSchema}
                onChange={setConfigSchema}
                title="Fields"
              />
            </div>
          </div>
        </div>
      )}

      {!editingSection && (
        <div className="flex flex-col gap-2">
          {isLoadingSectionDefinitions ? (
            <p>Loading...</p>
          ) : (
            filteredSections.map((section) => (
              <div
                key={section.id}
                style={{
                  backgroundColor: currentTheme.background_1_2,
                }}
                className={`${
                  selectedSection === null &&
                  "hover:brightness-[88%] dim cursor-pointer"
                } flex justify-between items-center rounded-[10px] px-[20px] py-[10px]`}
                onClick={() => handleSectionClick(section)}
              >
                <div className="w-[calc(100%-90px)] truncate">
                  <p className="font-semibold truncate">{section.name}</p>
                  <p
                    style={{ color: currentTheme.text_4 }}
                    className="text-sm truncate"
                  >
                    {section.identifier}
                  </p>
                </div>
                {!showForm && (
                  <div className="flex flex-row gap-[8px]">
                    <div
                      onClick={(e) => handleEditClick(e, section)}
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
                        handleDeleteSectionDef(section);
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

export default EditSectionDefinitions;
