// project/src/modules/PagesModule/SectionsSidbar.tsx
import { AuthContext } from "@/contexts/authContext";
import { ProjectPage, Section } from "@/types/pages";
import { appTheme } from "@/util/appTheme";
import React, { useContext, useEffect, useState } from "react";
import { FiChevronRight, FiEdit } from "react-icons/fi";
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
import { useUiStore } from "@/store/useUIStore";

interface SectionsSidebarProps {
  filteredActiveSections: Section[];
  handleContextMenu: (
    e: React.MouseEvent,
    input: ContextInput,
    type: ContextInputType
  ) => void;
}

interface SortableSectionItemProps {
  section: Section;
  handleContextMenu: (
    e: React.MouseEvent,
    input: ContextInput,
    type: ContextInputType
  ) => void;
}

const SortableSectionItem = ({
  section,
  handleContextMenu,
}: SortableSectionItemProps) => {
  const { currentUser } = useContext(AuthContext);
  const { setEditingSection } = useUiStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.section_id!,
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
        onClick={() => setEditingSection(section)}
        onContextMenu={(e) => handleContextMenu(e, section, "section")}
        className="dim hover:brightness-[85%] dim group cursor-pointer w-full h-[50px] flex justify-between items-center pl-[18px] pr-[12px] rounded-[8px]"
        style={{
          color: appTheme[currentUser.theme].text_4,
          backgroundColor: appTheme[currentUser.theme].background_1_2,
        }}
      >
        <p className="select-none truncate w-[calc(100%-40px)]">
          {section.name}
        </p>
        {currentUser.admin && (
          <div
            className="flex items-center justify-center min-w-[30px] w-[33px] h-[33px] rounded-full"
            style={{
              backgroundColor: appTheme[currentUser.theme].background_2_2,
            }}
          >
            <FiChevronRight size={25} />
          </div>
        )}
      </div>
    </div>
  );
};

const SectionsSidebar = ({
  filteredActiveSections,
  handleContextMenu,
}: SectionsSidebarProps) => {
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId, currentPage, currentSection } =
    useCurrentDataStore();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const [localSections, setLocalSections] = useState(filteredActiveSections);

  useEffect(() => {
    setLocalSections(filteredActiveSections);
  }, [filteredActiveSections]);

  const { reorderSections } = useContextQueries();

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!currentProjectId || !over || active.id === over.id) return;

    const oldIndex = localSections.findIndex(
      (s: Section) => s.section_id === active.id
    );
    const newIndex = localSections.findIndex(
      (s: Section) => s.section_id === over.id
    );

    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(localSections, oldIndex, newIndex);
    setLocalSections(newOrder);

    if (!currentPage || !currentPage.page_id || !currentPage.id) return;

    await reorderSections({
      project_idx: currentProjectId,
      project_page_id: currentPage.id,
      parent_section_id:
        currentSection && currentSection.id ? currentSection.id : null,
      orderedIds: newOrder.map((s) => s.section_id!),
    });
  };

  if (!currentUser) return null;
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localSections.map((p: Section) => p.section_id!)}
        strategy={verticalListSortingStrategy}
      >
        <div className="h-[100%] overflow-y-scroll flex flex-col gap-[9px]">
          {localSections.map((section: Section) => (
            <SortableSectionItem
              key={section.id}
              section={section}
              handleContextMenu={handleContextMenu}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default SectionsSidebar;
