// project/src/screens/Inventory/ProductPage/ProductImages.tsx
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
import { appTheme } from "@/util/appTheme";
import { useContext, useRef, useState } from "react";
import { AuthContext } from "@/contexts/authContext";
import { MediaLink } from "@/types/media";
import RenderedImage from "@/modules/components/ProductCard/RenderedImage";
import { useLeftBarOpenStore } from "@/store/useLeftBarOpenStore";

function SortableImage({
  id,
  url,
  index,
  setImageDisplayed,
  handleDeleteImage,
  imageEditorOpen,
  singleRow,
}: {
  id: string;
  url: string;
  index: number;
  setImageDisplayed: React.Dispatch<React.SetStateAction<string | null>>;
  handleDeleteImage: (index: number) => void;
  imageEditorOpen: boolean;
  singleRow: boolean;
}) {
  const { currentUser } = useContext(AuthContext);
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
    if (distance < wiggleThreshold) {
      setImageDisplayed(url);
    }
    startPos.current = null;
  };

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
        {!singleRow && (
          <div {...listeners} className="absolute inset-0 z-10 cursor-grab" />
        )}
        <RenderedImage url={url} />
        {!singleRow && (
          <div
            style={{
              border: `1px solid ${appTheme[currentUser.theme].text_4}`,
              backgroundColor: appTheme[currentUser.theme].background_1,
            }}
            className="ignore-click w-[20px] h-[20px] flex items-center justify-center dim hover:brightness-75 cursor-pointer rounded-[10px] absolute top-[-8px] right-[-9px] z-20"
            onClick={async () => {
              await handleDeleteImage(index);
            }}
          >
            <IoCloseOutline color={appTheme[currentUser.theme].text_2} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductImages({
  productImages,
  setProductImages,
  setImageDisplayed,
  imageEditorOpen,
  singleRow,
}: {
  productImages: MediaLink[];
  setProductImages: React.Dispatch<React.SetStateAction<MediaLink[]>>;
  setImageDisplayed: React.Dispatch<React.SetStateAction<string | null>>;
  imageEditorOpen: boolean;
  singleRow: boolean;
}) {
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

  const items = productImages.map((img) => ({
    id: img.media_id.toString(),
    url: img.url,
  }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = productImages.findIndex(
      (item) => item.media_id.toString() === active.id
    );
    const newIndex = productImages.findIndex(
      (item) => item.media_id.toString() === over.id
    );

    const reordered = arrayMove(productImages, oldIndex, newIndex).map(
      (img, idx) => ({ ...img, ordinal: idx })
    );

    setProductImages(reordered);
  };

  const handleDeleteImage = (index: number) => {
    setProductImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((img, idx) => ({
        ...img,
        ordinal: idx,
      }));
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
        items={items.map((item) => item.id)}
        strategy={rectSortingStrategy}
      >
        {productImages.length > 0 && (
          <div
            className={
              singleRow
                ? "flex flex-row h-[100%] gap-[11px] touch-none"
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
                url={item.url}
                setImageDisplayed={setImageDisplayed}
                handleDeleteImage={handleDeleteImage}
                imageEditorOpen={imageEditorOpen}
                singleRow={singleRow}
              />
            ))}
          </div>
        )}
      </SortableContext>
    </DndContext>
  );
}
