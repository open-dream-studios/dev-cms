"use client";
import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { usePageDefinitionsForm } from "@/hooks/usePageDefinitionsForm";
import { PageDefinitionFormData } from "@/util/schemas/pageDefinitionsSchema";
import { appTheme } from "@/util/appTheme";
import { FaChevronLeft, FaPlus, FaRegCircleCheck, FaTrash } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { FiEdit } from "react-icons/fi";
import Modal2Continue from "@/modals/Modal2Continue";
import { useModal2Store } from "@/store/useModalStore";
import { PageDefinition } from "@/types/pages";

const EditPageDefinitions = () => {
  const { currentUser } = useContext(AuthContext);
  const { pageDefinitions, upsertPageDefinition, deletePageDefinition, isLoadingPageDefinitions } =
    useContextQueries();

  const modal2 = useModal2Store((state: any) => state.modal2);
  const setModal2 = useModal2Store((state: any) => state.setModal2);

  const [selectedPage, setSelectedPage] = useState<PageDefinition | null>(null);
  const [editingPage, setEditingPage] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const form = usePageDefinitionsForm();

  const [allowedSections, setAllowedSections] = useState<string[]>([]);
  const [newSection, setNewSection] = useState("");

  useEffect(() => {
    if (showForm) form.setFocus("name");
  }, [showForm, form]);

  if (!currentUser) return null;

  const onSubmit = async (data: PageDefinitionFormData) => {
    const parentId = selectedPage ? selectedPage.id : null;

    await upsertPageDefinition({
      id: editingPage || undefined,
      name: data.name,
      identifier: data.identifier,
      allowed_sections: allowedSections,
      parent_page_definition_id: parentId,
    });

    setEditingPage(null);
    setShowForm(false);
    setAllowedSections([]);
    form.reset();
  };

  const handleShowForm = () => {
    form.reset({ name: "", identifier: "", allowed_sections: [] });
    setAllowedSections([]);
    setShowForm(true);
    setEditingPage(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPage(null);
    form.reset();
    setAllowedSections([]);
    setNewSection("");
  };

  const handleDeletePage = (page: PageDefinition) => {
    setModal2({
      ...modal2,
      open: !modal2.open,
      content: (
        <Modal2Continue
          text={`Delete page definition "${page.name}"?`}
          onContinue={() => deletePageDefinition(page.id)}
          threeOptions={false}
        />
      ),
    });
  };

  const handleEditClick = (e: React.MouseEvent, page: PageDefinition) => {
    e.stopPropagation();
    setEditingPage(page.id);
    form.reset({
      name: page.name,
      identifier: page.identifier,
      allowed_sections: page.allowed_sections || [],
    });
    setAllowedSections(page.allowed_sections || []);
    setShowForm(true);
  };

  const handlePageClick = (page: PageDefinition) => {
    if (selectedPage === null) setSelectedPage(page);
  };

  const handleBackClick = () => {
    setSelectedPage(null);
    setShowForm(false);
    setEditingPage(null);
    form.reset();
    setAllowedSections([]);
  };

  const handleAddSection = () => {
    if (newSection.trim() && !allowedSections.includes(newSection.trim())) {
      setAllowedSections([...allowedSections, newSection.trim()]);
      setNewSection("");
    }
  };

  const handleDeleteSection = (key: string) => {
    setAllowedSections(allowedSections.filter((s) => s !== key));
  };

  const filteredPages = useMemo(() => {
    return selectedPage === null
      ? pageDefinitions.filter((p) => p.parent_page_definition_id === null)
      : pageDefinitions.filter((p) => p.parent_page_definition_id === selectedPage.id);
  }, [pageDefinitions, selectedPage]);

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="w-full flex flex-col gap-[8px] h-[100%] overflow-y-scroll"
    >
      <div className="flex flex-row gap-[5px] items-center mb-[8px] justify-center">
        {selectedPage && (
          <div
            onClick={handleBackClick}
            className="cursor-pointer mt-[-2px] dim hover:brightness-75 flex items-center justify-center h-[33px] rounded-full w-[33px] opacity-[30%]"
          >
            <FaChevronLeft size={22} color={appTheme[currentUser.theme].text_3} />
          </div>
        )}
        <h2 className="text-[24px] ml-[4px] font-bold mt-[-5px] mr-[14px]">
          {selectedPage ? selectedPage.name : "Page Types"}
        </h2>

        {showForm ? (
          <div className="flex gap-[9px]">
            <button
              type="submit"
              style={{ backgroundColor: appTheme[currentUser.theme].background_2_selected }}
              className="cursor-pointer hover:brightness-75 dim flex items-center gap-2 pl-[15px] pr-[18px] py-[6px] rounded-full"
            >
              <FaRegCircleCheck /> Save
            </button>
            <button
              type="button"
              onClick={handleCancelForm}
              style={{ backgroundColor: appTheme[currentUser.theme].background_2_selected }}
              className="cursor-pointer hover:brightness-75 dim flex items-center gap-[4px] pl-[13px] pr-[19px] py-[6px] rounded-full"
            >
              <IoClose size={19} /> Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleShowForm}
            style={{ backgroundColor: appTheme[currentUser.theme].background_2_selected }}
            className="flex items-center justify-center w-[33px] h-[33px] rounded-full dim hover:brightness-75 cursor-pointer"
          >
            <FaPlus size={16} color={appTheme[currentUser.theme].text_4} />
          </button>
        )}
      </div>

      {showForm && (
        <div
          style={{ backgroundColor: appTheme[currentUser.theme].background_1_2 }}
          className="flex justify-between items-center rounded-[10px] px-[20px] py-[10px]"
        >
          <div className="w-full">
            <input
              {...form.register("name")}
              placeholder="Page name..."
              className="input outline-none rounded px-2 py-1 w-full text-[17px]"
            />
            <input
              {...form.register("identifier")}
              placeholder="Page identifier..."
              className="input outline-none px-2 py-1 w-full mt-2"
            />

            <div className="mt-4 px-2">
              <p className="font-semibold text-[17px] mb-[6px]">Allowed Sections</p>
              {allowedSections.length > 0 && (
                <div className="flex flex-wrap gap-2 my-1">
                  {allowedSections.map((s) => (
                    <div
                      key={s}
                      className="flex items-center gap-2 px-3 py-1 mt-[3px] mb-[1px] rounded-full text-sm"
                      style={{
                        backgroundColor: appTheme[currentUser.theme].background_2_selected,
                        color: appTheme[currentUser.theme].text_4,
                      }}
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(s)}
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
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  placeholder="Add a section..."
                  className="outline-none input py-[6px] rounded-[5px] text-[14px] flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddSection}
                  style={{ backgroundColor: appTheme[currentUser.theme].background_2_2 }}
                  className="hover:brightness-90 dim cursor-pointer w-[80px] rounded-full h-[30px] text-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!editingPage && (
        <div className="flex flex-col gap-2">
          {isLoadingPageDefinitions ? (
            <p>Loading...</p>
          ) : (
            filteredPages.map((page) => (
              <div
                key={page.id}
                style={{ backgroundColor: appTheme[currentUser.theme].background_1_2 }}
                className={`${
                  selectedPage === null && "hover:brightness-[88%] dim cursor-pointer"
                } flex justify-between items-center rounded-[10px] px-[20px] py-[10px]`}
                onClick={() => handlePageClick(page)}
              >
                <div className="w-[calc(100%-90px)] truncate">
                  <p className="font-semibold truncate">{page.name}</p>
                  <p style={{ color: appTheme[currentUser.theme].text_4 }} className="text-sm truncate">
                    {page.identifier}
                  </p>
                </div>
                {!showForm && (
                  <div className="flex flex-row gap-[8px]">
                    <div
                      onClick={(e) => handleEditClick(e, page)}
                      style={{ backgroundColor: appTheme[currentUser.theme].background_2_selected }}
                      className="flex items-center justify-center w-[36px] h-[36px] hover:brightness-90 dim cursor-pointer rounded-full"
                    >
                      <FiEdit size={18} color={appTheme[currentUser.theme].text_4} />
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePage(page);
                      }}
                      style={{ backgroundColor: appTheme[currentUser.theme].background_2_selected }}
                      className="flex items-center justify-center w-[36px] h-[36px] hover:brightness-90 dim cursor-pointer rounded-full"
                    >
                      <FaTrash size={15} color={appTheme[currentUser.theme].text_4} />
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

export default EditPageDefinitions;