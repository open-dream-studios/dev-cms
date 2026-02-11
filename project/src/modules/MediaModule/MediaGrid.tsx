// project/src/modules/MediaModule/MediaGrid.tsx
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Media, MediaFolder } from "@open-dream/shared";
import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "@/contexts/authContext";
import { IoCloseOutline } from "react-icons/io5";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import RenderedImage from "../components/ProductCard/RenderedImage";
import MediaPlayer from "./MediaPlayer";
import {
  setCurrentMediaItemsSelected,
  setCurrentMediaSelected,
  useCurrentDataStore,
} from "@/store/currentDataStore";
import { GrRotateRight } from "react-icons/gr";
import { useUiStore } from "@/store/useUIStore";
import { handleDeleteMedia, handleRotateMedia } from "./_actions/media.actions";
import { useFoldersCurrentDataStore } from "../_util/Folders/_store/folders.store";

type SortableMediaItemProps = {
  media: Media;
  disabled?: boolean;
  editMode: boolean;
  activeMedia: Media | null;
  openAllParents: (folder: MediaFolder) => void;
};

function SortableMediaItem({
  media,
  disabled = false,
  editMode,
  activeMedia,
  openAllParents,
}: SortableMediaItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: media.media_id!,
    disabled,
    animateLayoutChanges: () => false,
  });
  const { setDragItemSize } = useUiStore();
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { currentMediaItemsSelected } = useCurrentDataStore();
  const [showNotAllowed, setShowNotAllowed] = useState(false);
  const dragTimer = useRef<NodeJS.Timeout | null>(null);
  const nodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isDragging && nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      setDragItemSize({
        width: rect.width,
        height: rect.height,
      });
    }
  }, [isDragging]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) {
      dragTimer.current = setTimeout(() => {
        setShowNotAllowed(true);
      }, 150);
    }

    if (!disabled && listeners?.onPointerDown) {
      listeners.onPointerDown(e);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (disabled) {
      if (dragTimer.current) {
        clearTimeout(dragTimer.current);
        dragTimer.current = null;
      }
      setShowNotAllowed(false);
    }

    if (!disabled && listeners?.onPointerUp) {
      listeners.onPointerUp(e);
    }
  };

  // const cursorClass = disabled
  //   ? showNotAllowed
  //     ? "cursor-not-allowed"
  //     : "cursor-pointer"
  //   : isDragging
  //   ? "cursor-grabbing"
  //   : "cursor-grab";

  const cursorClass = editMode
    ? "cursor-pointer"
    : disabled
      ? showNotAllowed
        ? "cursor-not-allowed"
        : "cursor-pointer"
      : isDragging
        ? "cursor-grabbing"
        : "cursor-grab";

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
    zIndex: isDragging ? 9999 : "auto",
  };

  const handleMediaClick = (e: any) => {
    e.stopPropagation();
    if (editMode) {
      const exists = currentMediaItemsSelected.some(
        (m) => m.media_id === media.media_id,
      );
      if (exists) {
        setCurrentMediaItemsSelected(
          currentMediaItemsSelected.filter(
            (m) => m.media_id !== media.media_id,
          ),
        );
      } else {
        setCurrentMediaItemsSelected([...currentMediaItemsSelected, media]);
      }
      return;
    }

    // normal mode → open viewer
    setCurrentMediaSelected(media);
  };

  if (!currentUser) return null;

  return (
    <div
      // ref={setNodeRef}
      ref={(el) => {
        setNodeRef(el);
        nodeRef.current = el;
      }}
      style={style}
      {...attributes}
      onClick={handleMediaClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={`select-none relative overflow-visible rounded shadow-sm ${cursorClass} ${
        isDragging ? "shadow-xl" : ""
      }`}
    >
      {!(activeMedia && media.media_id === activeMedia.media_id) && (
        <div>
          {editMode && (
            <div>
              {currentMediaItemsSelected.some(
                (m) => m.media_id === media.media_id,
              ) && (
                <div
                  style={{
                    backgroundColor: currentTheme.text_2,
                    border: "0.5px solid " + currentTheme.text_1,
                  }}
                  className="absolute top-[-10px] left-[-5px] z-[150] w-[20px] h-[20px] flex items-center justify-center dim hover:brightness-75 cursor-pointer rounded-[20px]"
                  onClick={async (e: any) => {
                    e.stopPropagation();
                  }}
                >
                  <div
                    className="w-[13.5px] h-[13.5px] rounded-full shadow-md opacity-[0.8] brightness-115"
                    style={{ backgroundColor: currentTheme.app_color_1 }}
                  />
                </div>
              )}
              <div
                style={{
                  backgroundColor: currentTheme.background_1,
                  border: "0.5px solid " + currentTheme.text_3,
                }}
                className="absolute top-[-10px] right-[-7px] z-[150] w-[25px] h-[25px] flex items-center justify-center dim hover:brightness-75 cursor-pointer rounded-[20px]"
                onClick={async (e: any) => {
                  e.stopPropagation();
                  if (media.id && media.media_id) {
                    await handleDeleteMedia(media.id, media.media_id);
                  }
                }}
              >
                <IoCloseOutline color={currentTheme.text_2} />
              </div>
              <div
                style={{
                  backgroundColor: currentTheme.background_1,
                  border: "0.5px solid " + currentTheme.text_3,
                }}
                className="absolute top-[-10px] right-[20px] z-[150] w-[25px] h-[25px] flex items-center justify-center dim hover:brightness-75 cursor-pointer rounded-[20px]"
                onClick={async (e: any) => {
                  e.stopPropagation();
                  if (
                    media &&
                    media.media_id &&
                    media.url &&
                    media.url.length
                  ) {
                    await handleRotateMedia(media.media_id, media.url, 1);
                  }
                }}
              >
                <GrRotateRight color={currentTheme.text_2} />
              </div>
            </div>
          )}
          <RenderedImage media={media} rounded={false} />
        </div>
      )}
    </div>
  );
}

type MediaGridProps = {
  filteredMedia: Media[];
  view: "grid" | "list";
  projectId: number;
  editMode: boolean;
  openAllParents: (folder: MediaFolder) => void;
};

export default function MediaGrid({
  filteredMedia,
  view,
  editMode,
  openAllParents,
}: MediaGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { upsertMedia } = useContextQueries();
  const {
    currentMediaSelected,
    setCurrentMediaSelected,
    currentMediaItemsSelected,
  } = useCurrentDataStore();
  const { dragItemSize, setDraggingItem, hoveredFolder, setHoveredFolder } =
    useUiStore();
  const { selectedFolder } = useFoldersCurrentDataStore();

  const [localMedia, setLocalMedia] = useState<Media[]>([]);
  const [activeMedia, setActiveMedia] = useState<Media | null>(null);

  const originalMediaRef = useRef<Media[]>([]);
  useEffect(() => {
    const sortedMedia = [...filteredMedia].sort(
      (a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0),
    );
    setLocalMedia(sortedMedia);
    originalMediaRef.current = sortedMedia;
  }, [filteredMedia]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setDraggingItem(null);
    setHoveredFolder(null);

    if (hoveredFolder) {
      const draggedMediaId = active.id;
      const draggedMedia = localMedia.find(
        (m) => m.media_id === draggedMediaId,
      );
      if (draggedMedia) {
        if (draggedMedia && currentMediaItemsSelected.length <= 1) {
          await upsertMedia([
            {
              ...draggedMedia,
              folder_id: hoveredFolder === "-1" ? null : Number(hoveredFolder),
            },
          ]);
        } else {
          const movedMedia = currentMediaItemsSelected.map((m: Media) => ({
            ...m,
            folder_id: hoveredFolder === "-1" ? null : Number(hoveredFolder),
          }));
          await upsertMedia(movedMedia);
        }
      }
      return;
    }
    if (!over || active.id === over.id) return;

    const folderId = selectedFolder ? selectedFolder.id : null;
    const siblings = folderId
      ? localMedia.filter((m) => m.folder_id === folderId)
      : localMedia.filter((m) => m.folder_id === null);

    const oldIndex = siblings.findIndex((m) => m.media_id === active.id);
    const newIndex = siblings.findIndex((m) => m.media_id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newSiblingsOrder = arrayMove(siblings, oldIndex, newIndex);

    setLocalMedia((prev) => {
      const newState = prev.map((item) => {
        const idx = newSiblingsOrder.findIndex(
          (m) => m.media_id === item.media_id,
        );
        return idx > -1 ? { ...item, ordinal: idx } : item;
      });
      return newState.sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0));
    });

    const updatedMedia = newSiblingsOrder
      .map((m, idx) => ({ ...m, ordinal: idx }))
      .filter((m) => {
        const original = originalMediaRef.current.find(
          (om) => om.media_id === m.media_id,
        );
        return original && original.ordinal !== m.ordinal;
      });
    if (updatedMedia.length > 0) {
      await upsertMedia(updatedMedia);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="w-[100%] h-[100%] relative pb-[24px] overflow-auto">
      {currentMediaSelected && (
        <div
          className="fixed z-[990] top-0 left-0 w-[100%] h-[100%] flex items-center justify-center"
          style={{
            backgroundColor: currentTheme.background_1,
          }}
          onClick={() => setCurrentMediaSelected(null)}
        >
          <MediaPlayer />
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(event) => {
          const activeId = event.active.id;
          const dragged = localMedia.find((m) => m.media_id === activeId);
          if (dragged) setActiveMedia(dragged);
        }}
        onDragEnd={(event) => {
          setActiveMedia(null);
          handleDragEnd(event);
        }}
        onDragCancel={() => setActiveMedia(null)}
      >
        <SortableContext
          items={localMedia.map((m: Media) => m.media_id!)}
          strategy={rectSortingStrategy}
        >
          <div
            className={`p-4 grid gap-4 ${
              view === "grid"
                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                : "grid-cols-1"
            }`}
          >
            {localMedia.map((m) => (
              <SortableMediaItem
                key={`${m.media_id}-${m.version ?? 0}`}
                media={m}
                disabled={false}
                editMode={editMode}
                activeMedia={activeMedia}
                openAllParents={openAllParents}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeMedia ? (
            <div
              className="overflow-hidden"
              style={{
                width: dragItemSize?.width || 170,
                height: dragItemSize?.height || 170,
                pointerEvents: "none",
              }}
            >
              <RenderedImage
                key={activeMedia.version}
                media={activeMedia}
                rounded={false}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
