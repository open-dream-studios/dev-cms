// project/src/modules/PagesModule/PagesEditor.tsx
"use client";
import { useState, useContext, useMemo, useEffect, useRef } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { FaPlus } from "react-icons/fa6";
import { appTheme } from "@/util/appTheme";
import { PageDefinition, ProjectPage, Section } from "@shared/types/models/pages";
import { MdChevronLeft } from "react-icons/md";
import Divider from "@/lib/blocks/Divider";
import SiteEditor from "./SiteEditor";
import { domainToUrl, removeTrailingSlash } from "@/util/functions/Pages";
import PagesSidebar from "./PagesSidebar";
import SectionsSidebar from "./SectionsSidebar";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import PagesEditorToolbar from "./PagesEditorToolbar";
import DynamicSectionForm from "./DynamicSectionForm";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { useFormInstanceStore } from "@/store/formInstanceStore";
import {
  usePageForm,
  usePageFormSubmit,
  useSectionForm,
  useSectionFormSubmit,
} from "@/hooks/forms/usePageForm";
import { pageToForm } from "@/util/schemas/projectPageSchema";
import { sectionToForm } from "@/util/schemas/sectionSchema";
import { useWatch } from "react-hook-form";

export type ContextInput = ProjectPage | Section | null;
export type ContextInputType = "page" | "section";

const ProjectPagesEditor = () => {
  const { currentUser } = useContext(AuthContext);
  const {
    currentProjectId,
    currentProject,
    currentPage,
    currentSection,
    setCurrentPageData,
  } = useCurrentDataStore();
  const {
    projectPages,
    deleteProjectPage,
    pageDefinitions,
    sectionDefinitions,
    projectSections,
    deleteSection,
  } = useContextQueries();
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

  const sectionForm = useSectionForm();
  const { onPageFormSubmit } = usePageFormSubmit();
  const pageForm = usePageForm(currentPage);
  const { registerForm, unregisterForm } = useFormInstanceStore();

  const { onSectionFormSubmit } = useSectionFormSubmit();

  const [siteEditorKey, setSiteEditorKey] = useState<number>(0);

  const theme = currentUser?.theme ?? "dark";
  const t = appTheme[theme];

  const firstInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const formKey = "page";
    registerForm(formKey, pageForm);
    return () => unregisterForm(formKey);
  }, [pageForm, registerForm, unregisterForm]);

  useEffect(() => {
    if (currentPage) {
      pageForm.reset(pageToForm(currentPage), {
        keepValues: false,
      });
    } else {
      pageForm.reset({}, { keepValues: false });
    }
  }, [currentPage, pageForm]);

  useEffect(() => {
    if (addingPage) {
      firstInputRef.current?.focus();
    }
  }, [addingPage]);

  useEffect(() => {
    if (editingPage) {
      pageForm.reset(pageToForm(editingPage));
    } else if (addingPage) {
      pageForm.reset(pageToForm(null));
    }
  }, [editingPage, addingPage]);

  useEffect(() => {
    if (editingSection) {
      sectionForm.reset(sectionToForm(editingSection));
    } else if (addingSection) {
      sectionForm.reset(sectionToForm(null));
    }
  }, [editingSection, addingSection]);

  const handleDeletePage = async () => {
    if (!currentProjectId || !contextMenu || !contextMenu.input) return;
    if (contextMenu.type === "page") {
      const page = contextMenu.input as ProjectPage;
      if (page.page_id) {
        await deleteProjectPage(page.page_id);
      }
    }
  };

  const handleDeleteSection = async () => {
    if (!currentProjectId || !contextMenu || !contextMenu.input) return;
    if (contextMenu.type === "section") {
      const section = contextMenu.input as Section;
      if (section.section_id) {
        await deleteSection(section.section_id);
      }
    }
  };

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    input: ContextInput;
    type: ContextInputType;
  } | null>(null);

  useEffect(() => {
    const handler = () => setContextMenu(null);
    window.addEventListener("click", handler);
    const handler2 = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };
    window.addEventListener("keydown", handler2);
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("keydown", handler2);
    };
  }, []);

  const handleContextMenu = (
    e: React.MouseEvent,
    input: ContextInput,
    type: ContextInputType
  ) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      input,
      type,
    });
  };

  const handleCloseContextMenu = () => setContextMenu(null);

  const handleContextClick = async () => {
    if (contextMenu) {
      if (contextMenu.type === "section") {
        await handleDeleteSection();
      }
      if (contextMenu.type === "page") {
        await handleDeletePage();
      }
    }
  };

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

  const [siteUrl, setSiteUrl] = useState<string | null>(null);
  const nextUrl = currentProject?.domain
    ? domainToUrl(
        currentPage
          ? currentProject.domain + currentPage.slug
          : currentProject.domain
      )
    : null;

  useEffect(() => {
    if (
      nextUrl &&
      removeTrailingSlash(nextUrl) !== removeTrailingSlash(siteUrl)
    ) {
      setSiteUrl(removeTrailingSlash(nextUrl));
    }
  }, [nextUrl, siteUrl]);

  const definition_id = useWatch({
    control: sectionForm.control,
    name: "definition_id",
  });
  const config = useWatch({
    control: sectionForm.control,
    name: "config",
  });

  if (!currentUser || !currentProjectId) return null;

  return (
    <div className="flex w-full h-[100%]">
      <div
        className="w-60 h-[100%] flex flex-col px-[15px]"
        style={{
          borderRight: `0.5px solid ${t.background_2}`,
        }}
      >
        {contextMenu && (
          <div
            className="fixed z-50 bg-white border shadow-lg rounded-md py-1 w-40 animate-fade-in"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onContextMenu={handleCloseContextMenu}
          >
            <button
              onClick={handleContextClick}
              className="cursor-pointer w-full text-left px-3 py-2 text-sm hover:bg-red-50 hover:text-red-600"
            >
              {`Delete ${capitalizeFirstLetter(contextMenu.type)}`}
            </button>
          </div>
        )}

        <div className="flex flex-row items-center justify-between pt-[12px] pb-[6px]">
          <div className="flex flex-row gap-[13.5px] items-center w-[100%]">
            {(currentPage || editingPage || addingPage) && (
              <div
                onClick={handleBackClick}
                className="dim hover:brightness-75 cursor-pointer w-[30px] h-[30px] min-w-[30px] mt-[-5px] pr-[2px] pb-[2px] rounded-full flex justify-center items-center"
                style={{
                  backgroundColor: t.background_1_2,
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
                  backgroundColor: t.background_1_2,
                }}
              >
                <FaPlus size={12} />
              </div>
            )}
        </div>

        <Divider />

        {!currentPage ? (
          <>
            {(editingPage || addingPage) && (
              <form
                onSubmit={pageForm.handleSubmit(onPageFormSubmit)}
                className="w-[100%] rounded-[8px] p-[15px] flex flex-col gap-[10px]"
                style={{
                  backgroundColor: t.background_1_2,
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
                    backgroundColor: t.background_2_selected,
                    color: t.text_3,
                  }}
                >
                  <p className="opacity-[70%]">Save</p>
                </button>
              </form>
            )}
            {!editingPage && !addingPage && (
              <PagesSidebar
                filteredActivePages={filteredActivePages}
                handleContextMenu={handleContextMenu}
              />
            )}
          </>
        ) : (
          <>
            {addingSection || editingSection ? (
              <form
                onSubmit={sectionForm.handleSubmit(onSectionFormSubmit)}
                style={{
                  backgroundColor: t.background_1_2,
                }}
                className="flex flex-col gap-[10px] px-[15px] py-[15px] rounded-[8px]"
              >
                <p
                  className="text-[14px] font-[600] opacity-[0.8] leading-[15px]"
                  style={{
                    color: t.text_3,
                  }}
                >
                  Section Type
                </p>
                <div
                  className="dim hover:brightness-90 rounded-[6px] pr-[9px] mb-[10px]"
                  style={{
                    backgroundColor: t.background_2_2,
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
                    color: t.text_3,
                  }}
                >
                  Content
                </p>
                <div
                  style={{
                    backgroundColor: t.background_3,
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
                    backgroundColor: t.background_2_2,
                    color: t.text_2,
                  }}
                >
                  Save
                </button>
              </form>
            ) : (
              <SectionsSidebar
                filteredActiveSections={filteredActiveSections}
                handleContextMenu={handleContextMenu}
              />
            )}
          </>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <PagesEditorToolbar />

        {currentProject && siteUrl && (
          <SiteEditor key={siteEditorKey} src={siteUrl} />
        )}
      </div>
    </div>
  );
};

export default ProjectPagesEditor;
