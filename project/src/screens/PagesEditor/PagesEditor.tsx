// project/src/screens/PagesEditor/PagesEditor.tsx
import { useState, useContext, useMemo, useEffect } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useProjectContext } from "@/contexts/projectContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { FaPlus } from "react-icons/fa6";
import { appTheme } from "@/util/appTheme";
import {
  PageDefinition,
  ProjectPage,
  Section,
  SectionDefinition,
} from "@/types/pages";
import { SubmitHandler } from "react-hook-form";
import { ProjectPagesFormData } from "@/util/schemas/projectPagesSchema";
import {
  defaultProjectPagesFormValues,
  usePageForm,
} from "@/hooks/useProjectPagesForm";
import { MdChevronLeft } from "react-icons/md";
import Divider from "@/lib/blocks/Divider";
import { FiEdit } from "react-icons/fi";
import SiteEditor from "./SiteEditor";
import { domainToUrl, removeTrailingSlash } from "@/util/functions/Pages";
import PagesSidebar from "./PagesSidebar";
import SectionsSidebar from "./SectionsSidebar";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import {
  defaultProjectSectionsFormValues,
  useSectionForm,
} from "@/hooks/useSectionForm";
import { ProjectSectionsFormData } from "@/util/schemas/sectionSchema";
import PagesEditorToolbar from "./PagesEditorToolbar";
import DynamicSectionForm from "./DynamicSectionForm";

export type ContextInput = ProjectPage | Section | null;
export type ContextInputType = "page" | "section";

const ProjectPagesEditor = () => {
  const { currentUser } = useContext(AuthContext);
  const {
    currentProjectId,
    currentProject,
    currentPage,
    currentSection,
    setCurrentSectionData,
    setCurrentPageData,
  } = useProjectContext();
  const {
    projectPages,
    addProjectPage,
    deleteProjectPage,
    pageDefinitions,
    deleteSection,
    sectionDefinitions,
    addSection,
    projectSections,
  } = useContextQueries();

  const [editingPage, setEditingPage] = useState<ProjectPage | null>(null);
  const [addingPage, setAddingPage] = useState(false);

  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [addingSection, setAddingSection] = useState(false);

  const pageForm = usePageForm();
  const sectionForm = useSectionForm();
  const { isDirty, isValid, errors } = sectionForm.formState;
  // useEffect(() => {
  //   console.log({ isDirty, isValid, errors });
  // }, [isDirty, isValid, errors]);

  useEffect(() => {
    if (editingPage) {
      pageForm.reset({
        definition_id: editingPage.definition_id ?? null,
        title: editingPage.title,
        slug: editingPage.slug,
        order_index: editingPage.order_index ?? 0,
        seo_title: editingPage.seo_title ?? "",
        seo_description: editingPage.seo_description ?? "",
        seo_keywords:
          typeof editingPage.seo_keywords === "string"
            ? JSON.parse(editingPage.seo_keywords)
            : editingPage.seo_keywords ?? [],
        template: editingPage.template ?? "default",
        published: editingPage.published ?? true,
        parent_page_id: editingPage.parent_page_id ?? null,
      });
    } else if (addingPage) {
      pageForm.reset();
    }
  }, [editingPage, addingPage]);

  const onSubmit: SubmitHandler<ProjectPagesFormData> = async (data) => {
    if (!currentProjectId) return;
    try {
      await addProjectPage({
        ...data,
        id: editingPage?.id || undefined,
        project_idx: currentProjectId,
      });
      setAddingPage(false);
      setEditingPage(null);
      pageForm.reset();
    } catch (err) {
      console.error("Failed to save page:", err);
    }
  };

  // Reset section form when editing or adding changes
  useEffect(() => {
    if (editingSection) {
      sectionForm.reset({
        definition_id: editingSection.definition_id ?? null,
        name: editingSection.name ?? "",
        config: editingSection.config ?? {},
        order_index: editingSection?.order_index ?? undefined,
        parent_section_id: editingSection?.parent_section_id ?? null,
        project_page_id: editingSection?.project_page_id ?? null,
      });
    } else if (addingSection) {
      sectionForm.reset(defaultProjectSectionsFormValues);
    }
  }, [editingSection, addingSection]);

  const onSubmitSection: SubmitHandler<ProjectSectionsFormData> = async (
    data
  ) => {
    if (!currentProjectId || !currentPage) return;
    try {
      await addSection({
        ...data,
        id: editingSection?.id || undefined,
        project_idx: currentProjectId,
        parent_section_id: editingSection
          ? editingSection.parent_section_id
          : currentSection
          ? currentSection.id
          : null,
        project_page_id: currentPage.id,
      });
      setAddingSection(false);
      setEditingSection(null);
      sectionForm.reset();
    } catch (err) {
      console.error("Failed to save section:", err);
    }
  };

  const handleDeletePage = async () => {
    if (
      !currentProjectId ||
      !contextMenu ||
      contextMenu.type !== "page" ||
      !contextMenu.input
    )
      return;
    await deleteProjectPage({
      project_idx: currentProjectId,
      id: contextMenu.input.id,
    });
  };

  const handleDeleteSection = async () => {
    if (
      !currentProjectId ||
      !contextMenu ||
      contextMenu.type !== "section" ||
      !contextMenu.input
    )
      return;
    await deleteSection({
      project_idx: currentProjectId,
      id: contextMenu.input.id,
    });
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
      pageForm.reset(defaultProjectPagesFormValues);
      setAddingPage(true);
    } else {
      sectionForm.reset(defaultProjectSectionsFormValues);
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
    return currentSection === null
      ? projectSections.filter((p: Section) => p.parent_section_id === null)
      : projectSections.filter(
          (p) => p.parent_section_id === currentSection.id
        );
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

  if (!currentUser || !currentProjectId) return null;

  return (
    <div className="flex w-full h-[100%]">
      <div
        className="w-60 h-[100%] flex flex-col px-[15px]"
        style={{
          borderRight: `0.5px solid ${
            appTheme[currentUser.theme].background_2
          }`,
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
                  backgroundColor: appTheme[currentUser.theme].background_1_2,
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
                  backgroundColor: appTheme[currentUser.theme].background_1_2,
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
                onSubmit={pageForm.handleSubmit(onSubmit)}
                className="w-[100%] rounded-[8px] p-[15px] flex flex-col gap-[10px]"
                style={{
                  backgroundColor: appTheme[currentUser.theme].background_1_2,
                }}
              >
                <select
                  {...pageForm.register("definition_id")}
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
                {/* <input
              type="number"
              {...form.register("order_index")}
              placeholder="Order"
              className="input rounded p-[6px]"
            /> */}
                {/* <input
              {...form.register("seo_title")}
              placeholder="SEO Title"
              className="input rounded p-[6px]"
            />
            <textarea
              {...form.register("seo_description")}
              placeholder="SEO Description"
              className="input rounded p-[6px]"
            /> */}
                {/* <input
              {...form.register("template")}
              placeholder="Template"
              className="input rounded p-[6px]"
            /> */}
                {/* <label className="flex gap-2 items-center text-sm">
              <input type="checkbox" {...form.register("published")} />
              Published
            </label> */}
                <button
                  type="submit"
                  className="hover:brightness-90 dim px-[12px] py-[8px] rounded-full dim cursor-pointer font-[600]"
                  style={{
                    backgroundColor:
                      appTheme[currentUser.theme].background_2_selected,
                    color: appTheme[currentUser.theme].text_3,
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
                setEditingPage={setEditingPage}
              />
            )}
          </>
        ) : (
          <>
            {/* {(editingSection || addingSection) && (
              <form
                onSubmit={sectionForm.handleSubmit(onSubmitSection)}
                className="w-[100%] rounded-[8px] p-[15px] flex flex-col gap-[10px]"
                style={{
                  backgroundColor: appTheme[currentUser.theme].background_1_2,
                }}
              >
                <select
                  {...sectionForm.register("definition_id")}
                  className="input rounded p-[6px]"
                >
                  <option value="" disabled defaultValue="">
                    Section type
                  </option>
                  {sectionDefinitions.map((def: SectionDefinition) => (
                    <option key={def.id} value={def.id}>
                      {def.name}
                    </option>
                  ))}
                </select>
                <input
                  {...sectionForm.register("name")}
                  placeholder="Name"
                  className="input rounded p-[6px]"
                />

                <button
                  type="submit"
                  className="hover:brightness-90 dim px-[12px] py-[8px] rounded-full dim cursor-pointer font-[600]"
                  style={{
                    backgroundColor:
                      appTheme[currentUser.theme].background_2_selected,
                    color: appTheme[currentUser.theme].text_3,
                  }}
                >
                  <p className="opacity-[70%]">Save</p>
                </button>
              </form>
            )} */}
            {(addingSection || editingSection) && (
              <form
                onSubmit={sectionForm.handleSubmit(onSubmitSection)}
                className="flex flex-col gap-4 p-4 rounded bg-gray-50"
              >
                <select
                  {...sectionForm.register("definition_id")}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    sectionForm.setValue("definition_id", id);
                    sectionForm.setValue("config", {}); 
                  }}
                >
                  <option value="">-- Select Section Type --</option>
                  {sectionDefinitions.map((def) => (
                    <option key={def.id} value={def.id}>
                      {def.name}
                    </option>
                  ))}
                </select>

                {sectionForm.watch("definition_id") && (
                  <DynamicSectionForm
                    fields={
                      sectionDefinitions.find(
                        (d) => d.id === sectionForm.watch("definition_id")
                      )?.config_schema.fields || []
                    }
                    values={sectionForm.watch("config") || {}}
                    onChange={(cfg) =>
                      sectionForm.setValue("config", cfg, { shouldDirty: true })
                    }
                  />
                )}

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Save Section
                </button>
              </form>
            )}
            {!editingSection && !addingSection && (
              <SectionsSidebar
                filteredActiveSections={filteredActiveSections}
                handleContextMenu={handleContextMenu}
                setEditingSection={setEditingSection}
              />
            )}
          </>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <PagesEditorToolbar />

        {currentProject && siteUrl && <SiteEditor src={siteUrl} />}
      </div>
    </div>
  );
};

export default ProjectPagesEditor;
