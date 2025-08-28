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
import { useState, useEffect } from "react";
import { Media } from "@/types/media";

type SortableMediaItemProps = {
  media: Media;
  id: number;
};

function SortableMediaItem({ media, id }: SortableMediaItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded overflow-hidden border bg-white shadow-sm"
    >
      {media.type === "image" ? (
        <img
          src={media.url}
          alt={media.alt_text || ""}
          className="object-cover w-full h-[150px]"
        />
      ) : (
        <video src={media.url} className="w-full h-[150px]" controls />
      )}
    </div>
  );
}

type MediaGridProps = {
  media: Media[];
  view: "grid" | "list";
  projectId: number;
  onReorder: (newOrder: Media[]) => void;
};

export default function MediaGrid({ media, view, projectId, onReorder }: MediaGridProps) {
  const sensors = useSensors(useSensor(PointerSensor));
  const [items, setItems] = useState<Media[]>(media);

  useEffect(() => {
    setItems(media);
  }, [media]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);

    const newOrder = arrayMove(items, oldIndex, newIndex);
    setItems(newOrder);

    // 🔑 Send result back to parent
    onReorder(newOrder);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((m) => m.id)} strategy={rectSortingStrategy}>
        <div
          className={`p-4 grid gap-4 ${
            view === "grid" ? "grid-cols-4" : "grid-cols-1"
          }`}
        >
          {items.map((m) => (
            <SortableMediaItem key={m.id} id={m.id} media={m} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}