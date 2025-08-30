// project/src/components/Settings/ProjectPagesSettings.tsx
"use client";
import { useState, useMemo, useEffect, useContext } from "react";
import { FaPlus, FaTrash } from "react-icons/fa6";
import { FiEdit } from "react-icons/fi";
import { MdChevronLeft } from "react-icons/md";
import { appTheme } from "@/util/appTheme";
import { AuthContext } from "@/contexts/authContext";
import { useProjectContext } from "@/contexts/projectContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { PageDefinition, ProjectPage } from "@/types/pages";
import { SubmitHandler, useForm } from "react-hook-form";
import { ProjectPagesFormData } from "@/util/schemas/projectPagesSchema";
import { usePageForm } from "@/hooks/useProjectPagesForm";

const ProjectPagesSettings = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId } = useProjectContext();
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
      await addProjectPage({ ...data, project_idx: currentProjectId });
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
      form.reset();
    }
  }, [editingPage, addingPage]);

  const handleBackClick = () => {
    if (editingPage) {
      setEditingPage(null);
    } else if (selectedParentPage) {
      setSelectedParentPage(null);
    }
  };

  const handleDeletePage = async (page: ProjectPage) => {
    if (!currentProjectId) return;
    await deleteProjectPage({
      project_idx: currentProjectId,
      slug: page.slug,
    });
  };

  const filteredActivePages = useMemo(() => {
    return selectedParentPage === null
      ? projectPages.filter((p: ProjectPage) => p.parent_page_id === null)
      : projectPages.filter(
        (p) => p.parent_page_id === selectedParentPage.id
      );
  }, [projectPages, selectedParentPage]);

  if (!currentUser || !currentProjectId) return null;

  return (
    <div className="ml-[5px] md:ml-[8px] w-full h-full flex flex-col pt-[50px]">
      {/* HEADER */}
      <div className="ml-[1px] flex flex-row gap-[13.5px] items-center mb-[12px] w-[90%]">
        {(selectedParentPage || editingPage || addingPage) && (
          <div
            onClick={handleBackClick}
            className="dim hover:brightness-75 cursor-pointer w-[36px] h-[36px] rounded-full flex justify-center items-center"
            style={{
              backgroundColor: appTheme[currentUser.theme].background_1_2,
            }}
          >
            <MdChevronLeft size={29} />
          </div>
        )}
        <p className="font-[600] h-[40px] truncate text-[29px] leading-[33px]">
          {editingPage
            ? `Edit ${editingPage.title}`
            : addingPage
              ? "Add Page"
              : selectedParentPage
                ? selectedParentPage.title
                : "Pages"}
        </p>
        {!editingPage && !addingPage && (
          <div
            onClick={() => setAddingPage(true)}
            className="dim cursor-pointer w-[36px] h-[36px] rounded-full flex justify-center items-center"
            style={{
              backgroundColor: appTheme[currentUser.theme].background_1_2,
            }}
          >
            <FaPlus size={14} />
          </div>
        )}
      </div>

      {/* ADD/EDIT FORM */}
      {(editingPage || addingPage) && (
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-[90%] rounded-[8px] p-[15px] flex flex-col gap-[10px]"
          style={{
            backgroundColor: appTheme[currentUser.theme].background_1_2,
          }}
        >
          <select
            {...form.register("definition_id")}
            className="input rounded p-[6px]"
          >
            <option value="">Select Definition</option>
            {pageDefinitions.map((def: PageDefinition) => (
              <option key={def.id} value={def.id}>
                {def.name}
              </option>
            ))}
          </select>
          <input
            {...form.register("title")}
            placeholder="Page Title"
            className="input rounded p-[6px]"
          />

          {form.formState.errors.title && (
            <p className="text-red-500">{form.formState.errors.title.message}</p>
          )}
          <input
            {...form.register("slug")}
            placeholder="Slug"
            className="input rounded p-[6px]"
          />
          <input
            type="number"
            {...form.register("order_index")}
            placeholder="Order"
            className="input rounded p-[6px]"
          />
          <input
            {...form.register("seo_title")}
            placeholder="SEO Title"
            className="input rounded p-[6px]"
          />
          <textarea
            {...form.register("seo_description")}
            placeholder="SEO Description"
            className="input rounded p-[6px]"
          />
          <input
            {...form.register("template")}
            placeholder="Template"
            className="input rounded p-[6px]"
          />
          <label className="flex gap-2 items-center text-sm">
            <input type="checkbox" {...form.register("published")} />
            Published
          </label>
          <button
            type="submit"
            className="px-[12px] py-[8px] rounded-full dim cursor-pointer"
            style={{
              backgroundColor: appTheme[currentUser.theme].background_2_selected,
              color: appTheme[currentUser.theme].text_4,
            }}
          >
            Save Page
          </button>
        </form>
      )}

      {/* PAGE LIST */}
      {!editingPage && !addingPage && (
        <div
          className="w-[90%] max-h-[305px] overflow-y-scroll rounded-[8px]"
          style={{
            backgroundColor: appTheme[currentUser.theme].background_1_2,
          }}
        >
          {filteredActivePages.map((page, index) => (
            <div key={page.id} className="w-full relative">
              {index !== 0 && (
                <div
                  className="w-full h-[1px] opacity-50"
                  style={{
                    backgroundColor: appTheme[currentUser.theme].text_4,
                  }}
                />
              )}
              <div
                onClick={() => setSelectedParentPage(page)}
                className="group cursor-pointer w-full h-[50px] flex justify-between items-center px-[20px]"
                style={{ color: appTheme[currentUser.theme].text_4 }}
              >
                <p className="truncate w-[calc(100%-85px)]">{page.title}</p>
                <div className="flex gap-[11px]">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingPage(page);
                    }}
                    className="flex items-center justify-center w-[33px] h-[33px] rounded-full dim cursor-pointer"
                    style={{
                      backgroundColor:
                        appTheme[currentUser.theme].background_2_selected,
                    }}
                  >
                    <FiEdit size={15} />
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePage(page);
                    }}
                    className="flex items-center justify-center w-[33px] h-[33px] rounded-full dim cursor-pointer"
                    style={{
                      backgroundColor:
                        appTheme[currentUser.theme].background_2_selected,
                    }}
                  >
                    <FaTrash size={14} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectPagesSettings;