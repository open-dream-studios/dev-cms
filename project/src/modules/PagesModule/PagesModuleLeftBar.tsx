// project/src/modules/PagesModule/PagesModuleLeftBar.tsx
"use client";
import { useContext, useMemo, useEffect } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { FaPlus } from "react-icons/fa6";
import { PageDefinition, ProjectPage } from "@open-dream/shared";
import { MdChevronLeft } from "react-icons/md";
import Divider from "@/lib/blocks/Divider";
import PagesSidebar from "./PagesSidebar";
import SectionsSidebar from "./SectionsSidebar";
import DynamicSectionForm from "./DynamicSectionForm";
import {
  setCurrentPageData,
  setCurrentSectionData,
  useCurrentDataStore,
} from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { usePageForm, useSectionForm } from "@/hooks/forms/usePageForm";
import { pageToForm } from "@/util/schemas/projectPageSchema";
import { sectionToForm } from "@/util/schemas/sectionSchema";
import { useWatch } from "react-hook-form";
import { useCurrentTheme } from "@/hooks/util/useTheme"; 
import {
  onPageFormSubmit,
  onSectionFormSubmit,
} from "./_actions/pages.actions";

const PagesModuleLeftBar = () => { 
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { currentPage, currentSection, currentProjectId } =
    useCurrentDataStore();
  const {
    editingPage,
    setEditingPage,
    addingPage,
    setAddingPage,
    editingSection,
    setEditingSection,
    addingSection,
    setAddingSection,
  } = useUiStore();
  const { projectPages, pageDefinitions, sectionDefinitions, projectSections } =
    useContextQueries();

  const sectionForm = useSectionForm();
  const pageForm = usePageForm(currentPage);

  const definition_id = useWatch({
    control: sectionForm.control,
    name: "definition_id",
  });
  const config = useWatch({
    control: sectionForm.control,
    name: "config",
  });

  useEffect(() => {
    if (editingSection) {
      sectionForm.reset(sectionToForm(editingSection));
    } else if (addingSection) {
      sectionForm.reset(sectionToForm(null));
    }
  }, [editingSection, addingSection]);

  const handleAddItemClick = () => {
    if (!currentPage) {
      pageForm.reset(pageToForm(null));
      setAddingPage(true);
    } else {
      sectionForm.reset(sectionToForm(null));
      setAddingSection(true);
    }
  };

  const handleBackClick = () => {
    setCurrentSectionData(null);
    if (currentPage) {
      if (addingSection) {
        setAddingSection(false);
      } else if (editingSection) {
        setEditingSection(null);
      } else {
        setCurrentPageData(null);
      }
    } else {
      if (addingPage) {
        setAddingPage(false);
      } else if (editingPage) {
        setEditingPage(null);
      }
    }
  };

  const showHeaderText = () => {
    if (!currentPage) {
      if (editingPage) {
        return `${editingPage.title}`;
      } else if (addingPage) {
        return "Add Page";
      } else {
        return "Pages";
      }
    } else {
      if (editingSection) {
        return `${editingSection.name}`;
      } else if (addingSection) {
        return "Add Section";
      } else {
        return "Sections";
      }
    }
  };

  const filteredActivePages = useMemo(() => {
    return currentPage === null
      ? projectPages.filter((p: ProjectPage) => p.parent_page_id === null)
      : projectPages.filter((p) => p.parent_page_id === currentPage.id);
  }, [projectPages, currentPage]);

  const filteredActiveSections = useMemo(() => {
    return currentPage === null
      ? []
      : projectSections.filter((p) => p.project_page_id === currentPage.id);
  }, [projectSections, currentSection]);

  if (!currentUser || !currentProjectId) return null;

  return (
    <div
      className="w-[100%] h-[100%] flex flex-col px-[15px]"
      style={{
        borderRight: `0.5px solid ${currentTheme.background_2}`,
      }}
    >
      <div className="flex flex-row items-center justify-between pt-[12px] pb-[6px]">
        <div className="flex flex-row gap-[13.5px] items-center w-[100%]">
          {(currentPage || editingPage || addingPage) && (
            <div
              onClick={handleBackClick}
              className="dim hover:brightness-75 cursor-pointer w-[30px] h-[30px] min-w-[30px] mt-[-5px] pr-[2px] pb-[2px] rounded-full flex justify-center items-center"
              style={{
                backgroundColor: currentTheme.background_1_3,
              }}
            >
              <MdChevronLeft size={25} />
            </div>
          )}
          <p className="w-[100%] font-[600] h-[40px] truncate text-[24px] leading-[30px] mt-[1px]">
            {showHeaderText()}
          </p>
        </div>
        {currentUser.admin &&
          ((!editingPage && !addingPage && !currentPage) ||
            (!editingSection && !addingSection && !currentSection)) && (
            <div
              onClick={handleAddItemClick}
              className="dim cursor-pointer hover:brightness-[85%] min-w-[30px] w-[30px] h-[30px] mt-[-5px] rounded-full flex justify-center items-center"
              style={{
                backgroundColor: currentTheme.background_1_3,
              }}
            >
              <FaPlus size={12} />
            </div>
          )}
      </div>

      <Divider mb={10} />

      {!currentPage ? (
        <>
          {(editingPage || addingPage) && (
            <form
              onSubmit={pageForm.handleSubmit(onPageFormSubmit)}
              className="w-[100%] rounded-[8px] p-[15px] flex flex-col gap-[10px]"
              style={{
                backgroundColor: currentTheme.background_1_3,
              }}
            >
              <select
                {...pageForm.register("definition_id", {
                  valueAsNumber: true,
                })}
                className="input rounded p-[6px]"
              >
                <option value="" disabled defaultValue="">
                  Page type
                </option>
                {pageDefinitions.map((def: PageDefinition) => (
                  <option key={def.id} value={def.id}>
                    {def.name}
                  </option>
                ))}
              </select>
              <input
                {...pageForm.register("title")}
                placeholder="Title"
                className="input rounded p-[6px]"
              />
              <input
                {...pageForm.register("slug")}
                placeholder="Slug"
                className="input rounded p-[6px]"
                onChange={(e) => {
                  const filtered = e.target.value.replace(/[^a-z0-9-/]/g, "");
                  pageForm.setValue("slug", filtered, {
                    shouldValidate: true,
                  });
                }}
              />
              <button
                type="submit"
                className="hover:brightness-90 dim px-[12px] py-[8px] rounded-full dim cursor-pointer font-[600]"
                style={{
                  backgroundColor: currentTheme.background_2_selected,
                  color: currentTheme.text_3,
                }}
              >
                <p className="opacity-[70%]">Save</p>
              </button>
            </form>
          )}
          {!editingPage && !addingPage && (
            <PagesSidebar filteredActivePages={filteredActivePages} />
          )}
        </>
      ) : (
        <>
          {addingSection || editingSection ? (
            <form
              onSubmit={sectionForm.handleSubmit(onSectionFormSubmit)}
              style={{
                backgroundColor: currentTheme.background_1_3,
              }}
              className="flex flex-col gap-[10px] px-[15px] py-[15px] rounded-[8px]"
            >
              <p
                className="text-[14px] font-[600] opacity-[0.8] leading-[15px]"
                style={{
                  color: currentTheme.text_3,
                }}
              >
                Section Type
              </p>
              <div
                className="dim hover:brightness-90 rounded-[6px] pr-[9px] mb-[10px]"
                style={{
                  backgroundColor: currentTheme.background_2_2,
                }}
              >
                <select
                  {...sectionForm.register("definition_id")}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    sectionForm.setValue("definition_id", id);
                    // sectionForm.setValue("config", {});
                  }}
                  className="w-[100%] py-[5px] pl-[9px] mr-[9px] outline-none border-none cursor-pointer"
                >
                  {sectionDefinitions.map((def) => (
                    <option key={def.id} value={Number(def.id)}>
                      {def.name}
                    </option>
                  ))}
                </select>
              </div>

              <p
                className="text-[14px] font-[600] opacity-[0.8] leading-[15px]"
                style={{
                  color: currentTheme.text_3,
                }}
              >
                Content
              </p>
              <div
                style={{
                  backgroundColor: currentTheme.background_3,
                }}
                className="w-[100%] h-[1.3px] mt-[-2px] rounded-[2px] opacity-[0.5]"
              />

              <DynamicSectionForm
                fields={
                  sectionDefinitions.find((d) => d.id === definition_id)
                    ?.config_schema.fields || []
                }
                values={config || {}}
                onChange={(cfg) =>
                  sectionForm.setValue("config", cfg, { shouldDirty: true })
                }
              />

              <button
                type="submit"
                className="mt-[6px] dim hover:brightness-90 cursor-pointer px-4 py-2 rounded-[8px] text-[15px] font-[600]"
                style={{
                  backgroundColor: currentTheme.background_2_2,
                  color: currentTheme.text_2,
                }}
              >
                Save
              </button>
            </form>
          ) : (
            <SectionsSidebar filteredActiveSections={filteredActiveSections} />
          )}
        </>
      )}
    </div>
  );
};

export default PagesModuleLeftBar;
