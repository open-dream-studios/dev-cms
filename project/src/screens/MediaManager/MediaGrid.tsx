// project/src/screens/Dashboard/MediaGrid.tsx
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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Media, MediaFolder } from "@/types/media";
import { appTheme } from "@/util/appTheme";
import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "@/contexts/authContext";
import { IoCloseOutline } from "react-icons/io5";
import { useContextQueries } from "@/contexts/queryContext";

type SortableMediaItemProps = {
  media: Media;
  id: number;
  disabled?: boolean;
  editMode: boolean;
};

function SortableMediaItem({
  media,
  id,
  disabled = false,
  editMode,
}: SortableMediaItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled, animateLayoutChanges: () => false });

  const { currentUser } = useContext(AuthContext);
  const { deleteMedia } = useContextQueries();

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
    zIndex: isDragging ? 9999 : "auto",
  };

  if (!currentUser) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(!disabled ? listeners : {})}
      className={`relative overflow-visible rounded border bg-white shadow-sm ${
        !disabled ? "cursor-grab" : "cursor-pointer"
      } ${isDragging ? "shadow-xl" : ""}`}
    >
      {editMode && (
        <div
          style={{
            border: `1px solid ${appTheme[currentUser.theme].text_4}`,
            backgroundColor: appTheme[currentUser.theme].background_1,
          }}
          className="absolute top-[-8px] right-[-9px] z-[950] w-[26px] h-[26px] flex items-center justify-center dim hover:brightness-75 cursor-pointer rounded-[20px]"
          onClick={async () => await deleteMedia(id)}
        >
          <IoCloseOutline color={appTheme[currentUser.theme].text_2} />
        </div>
      )}
      {media.type === "image" ? (
        <img
          style={{ willChange: "transform" }}
          draggable={false}
          src={media.url}
          alt={media.alt_text || ""}
          className="dim hover:brightness-90 object-cover w-full h-[150px]"
        />
      ) : (
        <video
          style={{ willChange: "transform" }}
          draggable={false}
          src={media.url}
          className="w-full h-[150px]"
          controls
        />
      )}
    </div>
  );
}

type MediaGridProps = {
  media: Media[];
  view: "grid" | "list";
  projectId: number;
  onReorder: (newOrder: Media[]) => void;
  activeFolder: MediaFolder | null;
  editMode: boolean;
};

export default function MediaGrid({
  media,
  view,
  onReorder,
  activeFolder,
  editMode,
}: MediaGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, 
      },
    })
  );
  const [localMedia, setLocalMedia] = useState<Media[]>([]);

  useEffect(() => {
    setLocalMedia(
      [...media].sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0))
    );
  }, [media]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localMedia.findIndex((i) => i.id === active.id);
    const newIndex = localMedia.findIndex((i) => i.id === over.id);

    const newOrder = arrayMove(localMedia, oldIndex, newIndex);
    setLocalMedia(newOrder);
    onReorder(newOrder);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localMedia.map((m) => m.id)}
        strategy={rectSortingStrategy}
      >
        <div
          className={`p-4 grid gap-4 ${
            view === "grid" ? "grid-cols-4" : "grid-cols-1"
          }`}
        >
          {localMedia.map((m) => (
            <SortableMediaItem
              key={m.id}
              id={m.id}
              media={m}
              disabled={activeFolder === null}
              editMode={editMode}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
