// project/src/modules/PagesModule/PagesSidebar.tsx
import { AuthContext } from "@/contexts/authContext";
import { ProjectPage } from "@/types/pages";
import { appTheme } from "@/util/appTheme";
import React, { useContext, useEffect, useState } from "react";
import { FiEdit } from "react-icons/fi";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useContextQueries } from "@/contexts/queryContext/queryContext"; 
import { ContextInput, ContextInputType } from "./PagesEditor";
import { useCurrentDataStore } from "@/store/currentDataStore";

interface PagesSidebarProps {
  filteredActivePages: ProjectPage[];
  handleContextMenu: (
    e: React.MouseEvent,
    input: ContextInput,
    type: ContextInputType
  ) => void;
  setEditingPage: React.Dispatch<React.SetStateAction<ProjectPage | null>>;
}

interface SortablePageItemProps {
  page: ProjectPage;
  setEditingPage: React.Dispatch<React.SetStateAction<ProjectPage | null>>;
  handleContextMenu: (
    e: React.MouseEvent,
    input: ContextInput,
    type: ContextInputType
  ) => void;
}

const SortablePageItem = ({
  page,
  setEditingPage,
  handleContextMenu,
}: SortablePageItemProps) => {
  const { currentUser } = useContext(AuthContext);
  const { currentPage, setCurrentPageData } = useCurrentDataStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: page.page_id!,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(
      transform ? { ...transform, x: 0 } : transform
    ),
    transition,
    zIndex: isDragging ? 9999 : "auto",
  };

  if (!currentUser) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="w-full relative"
    >
      <div
        onClick={() => setCurrentPageData(page)}
        onContextMenu={(e) => handleContextMenu(e, page, "page")}
        className="dim hover:brightness-[85%] dim group cursor-pointer w-full h-[50px] flex justify-between items-center pl-[18px] pr-[12px] rounded-[8px]"
        style={{
          color: appTheme[currentUser.theme].text_4,
          backgroundColor: appTheme[currentUser.theme].background_1_2,
        }}
      >
        <p className="select-none truncate w-[calc(100%-40px)]">{page.title}</p>
        {currentUser.admin && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setEditingPage(page);
            }}
            className="hover:brightness-90 dim flex items-center justify-center min-w-[30px] w-[33px] h-[33px] rounded-full dim cursor-pointer"
            style={{
              backgroundColor:
                appTheme[currentUser.theme].background_2_selected,
            }}
          >
            <FiEdit size={15} />
          </div>
        )}
      </div>
    </div>
  );
};

const PagesSidebar = ({
  filteredActivePages,
  handleContextMenu,
  setEditingPage,
}: PagesSidebarProps) => {
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId, currentPage } = useCurrentDataStore();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const [localPages, setLocalPages] = useState(filteredActivePages);

  useEffect(() => {
    setLocalPages(filteredActivePages);
  }, [filteredActivePages]);

  const { reorderProjectPages } = useContextQueries();

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (currentProjectId && over && active.id !== over.id) {
      const oldIndex = localPages.findIndex((p) => p.page_id === active.id);
      const newIndex = localPages.findIndex((p) => p.page_id === over.id);
      const newOrder = arrayMove(localPages, oldIndex, newIndex);
      setLocalPages(newOrder);

      await reorderProjectPages({
        project_idx: currentProjectId,
        parent_page_id: currentPage?.id ?? null,
        orderedIds: newOrder.map((p) => p.page_id!),
      });
    }
  };

  if (!currentUser) return null;
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localPages.map((p) => p.page_id!)}
        strategy={verticalListSortingStrategy}
      >
        <div className="h-[100%] overflow-y-scroll flex flex-col gap-[9px]">
          {localPages.map((page: ProjectPage) => (
            <SortablePageItem
              key={page.id}
              page={page}
              setEditingPage={setEditingPage}
              handleContextMenu={handleContextMenu}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default PagesSidebar;
