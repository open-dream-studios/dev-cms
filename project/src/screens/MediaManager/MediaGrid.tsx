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
import { Media } from "@/types/media";

type SortableMediaItemProps = {
  media: Media;
  id: number;
  disabled?: boolean;
};

function SortableMediaItem({
  media,
  id,
  disabled = false,
}: SortableMediaItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 9999 : "auto", // 👈 float dragged item above others
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(!disabled ? listeners : {})}
      className={`rounded overflow-hidden border bg-white shadow-sm ${
        !disabled ? "cursor-grab" : "cursor-pointer"
      } ${isDragging ? "shadow-xl" : ""}`} // 👈 add a stronger shadow for clarity
    >
      {media.type === "image" ? (
        <img
          draggable={false}
          src={media.url}
          alt={media.alt_text || ""}
          className="dim hover:brightness-90 object-cover w-full h-[150px]"
        />
      ) : (
        <video
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
  activeFolder: number | null;
};

export default function MediaGrid({
  media,
  view,
  onReorder,
  activeFolder,
}: MediaGridProps) {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = media.findIndex((i) => i.id === active.id);
    const newIndex = media.findIndex((i) => i.id === over.id);

    const newOrder = arrayMove(media, oldIndex, newIndex);
    onReorder(newOrder); // this triggers the mutation with optimistic update
  };

  const sortedMedia = [...media].sort(
    (a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0)
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortedMedia.map((m) => m.id)}
        strategy={rectSortingStrategy}
      >
        <div
          className={`p-4 grid gap-4 ${
            view === "grid" ? "grid-cols-4" : "grid-cols-1"
          }`}
        >
          {sortedMedia.map((m) => (
            <SortableMediaItem
              key={m.id}
              id={m.id}
              media={m}
              disabled={activeFolder === null}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
