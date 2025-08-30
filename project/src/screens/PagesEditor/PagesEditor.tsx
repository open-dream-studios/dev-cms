// project/src/screens/MediaManager/MediaManager.tsx
import { useState, useContext, useMemo, useEffect } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useProjectContext } from "@/contexts/projectContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { FaPlus } from "react-icons/fa6";
import { appTheme } from "@/util/appTheme";
import { PageDefinition, ProjectPage } from "@/types/pages";
import { SubmitHandler } from "react-hook-form";
import { ProjectPagesFormData } from "@/util/schemas/projectPagesSchema";
import { defaultProjectPagesFormValues, usePageForm } from "@/hooks/useProjectPagesForm";
import { MdChevronLeft } from "react-icons/md";
import Divider from "@/lib/blocks/Divider";
import { FiEdit } from "react-icons/fi";
import SiteEditor from "./SiteEditor";
import { domainToUrl } from "@/util/functions/Pages";
import PagesSidebar from "./PagesSidebar";

const ProjectPagesEditor = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId, currentProject } = useProjectContext();
  const {
    projectPages,
    addProjectPage,
    deleteProjectPage,
    pageDefinitions,
  } = useContextQueries();

  const [selectedParentPage, setSelectedParentPage] =
    useState<ProjectPage | null>(null);
  const [editingPage, setEditingPage] = useState<ProjectPage | null>(null);
  const [addingPage, setAddingPage] = useState(false);

  const form = usePageForm();
  // const { isDirty, isValid, errors } = form.formState;
  // useEffect(() => {
  //   console.log({ isDirty, isValid, errors });
  // }, [isDirty, isValid, errors]);

  useEffect(() => {
    if (editingPage) {
      form.reset({
        definition_id: editingPage.definition_id ?? null,
        title: editingPage.title,
        slug: editingPage.slug,
        order_index: editingPage.order_index ?? 0,
        seo_title: editingPage.seo_title ?? "",
        seo_description: editingPage.seo_description ?? "",
        seo_keywords: typeof editingPage.seo_keywords === "string"
          ? JSON.parse(editingPage.seo_keywords)
          : editingPage.seo_keywords ?? [],
        template: editingPage.template ?? "default",
        published: editingPage.published ?? true,
        parent_page_id: editingPage.parent_page_id ?? null,
      });
    } else if (addingPage) {
      form.reset();
    }
  }, [editingPage, addingPage]);

  const onSubmit: SubmitHandler<ProjectPagesFormData> = async (data) => {
    if (!currentProjectId) return;
    try {
      await addProjectPage({ ...data, id: editingPage?.id || undefined, project_idx: currentProjectId });
      setAddingPage(false);
      setEditingPage(null);
      form.reset();
    } catch (err) {
      console.error("Failed to save page:", err);
    }
  };

  // Reset form when editing or adding changes
  useEffect(() => {
    if (editingPage) {
      form.reset({
        definition_id: editingPage.definition_id ?? null,
        title: editingPage.title,
        slug: editingPage.slug,
        order_index: editingPage.order_index,
        seo_title: editingPage.seo_title ?? undefined,
        seo_description: editingPage.seo_description ?? undefined,
        seo_keywords:
          typeof editingPage.seo_keywords === "string"
            ? JSON.parse(editingPage.seo_keywords)
            : editingPage.seo_keywords ?? [],
        template: editingPage.template ?? "default",
        published: editingPage.published ?? true,
        parent_page_id: editingPage.parent_page_id ?? null,
      });
    } else if (addingPage) {
      form.reset(defaultProjectPagesFormValues);
    }
  }, [editingPage, addingPage]);

  const handleBackClick = () => {
    if (addingPage) {
      setAddingPage(false)
    } else if (editingPage) {
      setEditingPage(null);
    } else if (selectedParentPage) {
      setSelectedParentPage(null);
    }
  };

  const handleDeletePage = async () => {
    if (!currentProjectId || !contextMenu || !contextMenu.page) return;
    await deleteProjectPage({
      project_idx: currentProjectId,
      id: contextMenu.page.id,
    });
  };

  const filteredActivePages = useMemo(() => {
    return selectedParentPage === null
      ? projectPages.filter((p: ProjectPage) => p.parent_page_id === null)
      : projectPages.filter(
        (p) => p.parent_page_id === selectedParentPage.id
      );
  }, [projectPages, selectedParentPage]);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    page: ProjectPage | null;
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
    }
  }, []);

  const handleContextMenu = (e: React.MouseEvent, page: ProjectPage) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      page,
    });
  };

  const handleCloseContextMenu = () => setContextMenu(null);

  const handleAddPageClick = () => {
    form.reset(defaultProjectPagesFormValues)
    setAddingPage(true)
  }

  if (!currentUser || !currentProjectId) return null;

  return (
    <div className="flex w-full h-[100%]">
      <div className="w-60 h-[100%] flex flex-col px-[15px]" style={{
        borderRight: `0.5px solid ${appTheme[currentUser.theme].background_2
          }`
      }}>
        {contextMenu && (
          <div
            className="fixed z-50 bg-white border shadow-lg rounded-md py-1 w-40 animate-fade-in"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onContextMenu={handleCloseContextMenu}
          >
            <button
              onClick={handleDeletePage}
              className="cursor-pointer w-full text-left px-3 py-2 text-sm hover:bg-red-50 hover:text-red-600"
            >
              Delete Page
            </button>
          </div>
        )}

        <div className="flex flex-row items-center justify-between pt-[12px] pb-[6px]">
          <div className="flex flex-row gap-[13.5px] items-center w-[100%]">
            {(selectedParentPage || editingPage || addingPage) && (
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
              {editingPage
                ? `${editingPage.title}`
                : addingPage
                  ? "Add Page"
                  : selectedParentPage
                    ? selectedParentPage.title
                    : "Pages"}
            </p>

          </div>
          {currentUser.admin && !editingPage && !addingPage && !selectedParentPage && (
            <div
              onClick={handleAddPageClick}
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

        {(editingPage || addingPage) && (
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-[100%] rounded-[8px] p-[15px] flex flex-col gap-[10px]"
            style={{
              backgroundColor: appTheme[currentUser.theme].background_1_2,
            }}
          >
            <select
              {...form.register("definition_id")}
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
              {...form.register("title")}
              placeholder="Title"
              className="input rounded p-[6px]"
            />
            <input
              {...form.register("slug")}
              placeholder="Slug"
              className="input rounded p-[6px]"
              onChange={(e) => {
                const filtered = e.target.value.replace(/[^a-z0-9-/]/g, "");
                form.setValue("slug", filtered, { shouldValidate: true });
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
                backgroundColor: appTheme[currentUser.theme].background_2_selected,
                color: appTheme[currentUser.theme].text_3,
              }}
            >
              <p className="opacity-[70%]">
                Save
              </p>
            </button>
          </form>
        )}

        {!editingPage && !addingPage && (
          <PagesSidebar filteredActivePages={filteredActivePages} setSelectedParentPage={setSelectedParentPage} handleContextMenu={handleContextMenu} setEditingPage={setEditingPage} />
        )}
      </div>

      <div className="flex-1 flex flex-col">
        {/* <ProjectPagesToolbar
          view={view}
          setView={setView}
          onUploadClick={() => setUploadPopup(true)}
          editeMode={editMode}
          setEditMode={setEditMode}
          activeFolder={activeFolder}
        /> */}

        {currentProject && <SiteEditor src={currentProject.domain ? domainToUrl(selectedParentPage ? currentProject.domain + selectedParentPage.slug : currentProject.domain) : ""} />}
      </div>
    </div>
  );
};

export default ProjectPagesEditor;
