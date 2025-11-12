// project/src/modules/components/ImageGallery.tsx
"use client";
import { IoCloseOutline } from "react-icons/io5";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useContext, useMemo, useRef } from "react";
import { AuthContext } from "@/contexts/authContext";
import { Media, MediaLink, MediaUsage } from "@open-dream/shared";
import RenderedImage from "@/modules/components/ProductCard/RenderedImage";
import { useLeftBarOpenStore } from "@/store/useLeftBarOpenStore";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useCurrentTheme } from "@/hooks/useTheme";
import { useContextQueries } from "@/contexts/queryContext/queryContext";

function SortableImage({
  id,
  mediaLink,
  index,
  onMediaClick,
  handleDeleteImage,
  singleRow,
  enableReorder,
  showDeleteButtons,
}: {
  id: string;
  mediaLink: any;
  index: number;
  onMediaClick: (media: Media) => Promise<void>;
  handleDeleteImage: (index: number) => void;
  singleRow: boolean;
  enableReorder: boolean;
  showDeleteButtons: boolean;
}) {
  const { currentUser } = useContext(AuthContext);
  const { media } = useContextQueries();
  const currentTheme = useCurrentTheme();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
    zIndex: isDragging ? 999 : 1,
    position: "relative",
  };

  const startPos = useRef<{ x: number; y: number } | null>(null);
  const wiggleThreshold = 5;

  const handleMouseDown = (e: React.MouseEvent) => {
    startPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest(".ignore-click")) return;

    if (!startPos.current) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < wiggleThreshold && matchedMedia) {
      onMediaClick(matchedMedia);
    }
    startPos.current = null;
  };

  const matchedMedia = useMemo(() => {
    return media.find((item: Media) => item.id === parseInt(mediaLink.id));
  }, [media, mediaLink]);

  if (!currentUser) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="relative aspect-square"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div className="select-none cursor-pointer hover:brightness-75 dim w-[100%] h-[100%] inset-0">
        {enableReorder && (
          <div {...listeners} className="absolute inset-0 z-10 cursor-grab" />
        )}
        {matchedMedia && <RenderedImage media={matchedMedia} rounded={true} />}
        {showDeleteButtons && (
          <div
            style={{
              border: `1px solid ${currentTheme.text_4}`,
              backgroundColor: currentTheme.background_1,
            }}
            className="ignore-click w-[20px] h-[20px] flex items-center justify-center dim hover:brightness-75 cursor-pointer rounded-[10px] absolute top-[-8px] right-[-9px] z-20"
            onClick={async () => {
              await handleDeleteImage(index);
            }}
          >
            <IoCloseOutline color={currentTheme.text_2} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ImageGallery({
  enableReorder,
  showDeleteButtons,
  onDeleteLink,
  onReorder,
  singleRow,
  entityType,
  onMediaClick,
}: {
  enableReorder: boolean;
  showDeleteButtons: boolean;
  onDeleteLink: (link: MediaLink) => Promise<void>;
  onReorder: (reordered: MediaLink[]) => Promise<void>;
  singleRow: boolean;
  entityType: MediaUsage;
  onMediaClick: (media: Media) => Promise<void>;
}) {
  const {
    currentProductImages,
    setCurrentProductImages,
    currentJobImages,
    setCurrentJobImages,
  } = useCurrentDataStore();
  const { currentUser } = useContext(AuthContext);
  const leftBarOpen = useLeftBarOpenStore((state: any) => state.leftBarOpen);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  );

  let images: MediaLink[] = [];
  let setImages: (imgs: MediaLink[]) => void;

  if (entityType === "job") {
    images = currentJobImages;
    setImages = setCurrentJobImages;
  } else if (entityType === "product") {
    images = currentProductImages;
    setImages = setCurrentProductImages;
  }

  const items = images.map((img) => ({
    id: img.media_id.toString(),
    url: img.url,
  }));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex(
      (item) => item.media_id.toString() === active.id
    );
    const newIndex = images.findIndex(
      (item) => item.media_id.toString() === over.id
    );
    const reordered = arrayMove(images, oldIndex, newIndex).map((img, idx) => ({
      ...img,
      ordinal: idx,
    }));
    setImages(reordered);
    await onReorder(reordered)
  };

  const handleDeleteImage = async (index: number) => {
    await onDeleteLink(currentJobImages[index]);
    const filtered = images.filter((_, i) => i !== index);
    const newImages = filtered.map((img, idx) => ({
      ...img,
      ordinal: idx,
    }));
    setImages(newImages);
  };

  if (!currentUser) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={rectSortingStrategy}
      >
        {images.length > 0 && (
          <div
            className={
              singleRow
                ? "flex flex-row h-[100%] gap-[11px] touch-none w-[100%]"
                : `gap-[11px] touch-none py-[4px] md:py-[6px] grid grid-cols-3 min-[400px]:grid-cols-4 min-[500px]:grid-cols-5 min-[580px]:grid-cols-4 min-[720px]:grid-cols-5 min-[870px]:grid-cols-4 
                ${
                  leftBarOpen
                    ? "min-[1230px]:grid-cols-5 min-[1330px]:grid-cols-6"
                    : "min-[1010px]:grid-cols-5 min-[1100px]:grid-cols-6"
                }`
            }
          >
            {items.map((item: any, index: number) => (
              <SortableImage
                key={`${item.id}${item.url}`}
                id={item.id}
                index={index}
                mediaLink={item}
                onMediaClick={onMediaClick}
                handleDeleteImage={handleDeleteImage}
                singleRow={singleRow}
                enableReorder={enableReorder}
                showDeleteButtons={showDeleteButtons}
              />
            ))}
          </div>
        )}
      </SortableContext>
    </DndContext>
  );
}
