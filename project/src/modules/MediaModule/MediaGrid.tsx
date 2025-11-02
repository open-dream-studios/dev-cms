// project/src/modules/MediaModule/MediaGrid.tsx
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
import { Media, MediaFolder } from "@open-dream/shared";
import { appTheme } from "@/util/appTheme";
import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "@/contexts/authContext";
import { IoCloseOutline } from "react-icons/io5";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useMedia } from "@/hooks/useMedia";
import { useDnDStore } from "@/store/useDnDStore";

type SortableMediaItemProps = {
  media: Media;
  disabled?: boolean;
  editMode: boolean;
  setMediaSelected: React.Dispatch<React.SetStateAction<Media | null>>;
  activeFolder: MediaFolder | null;
  setActiveFolder: React.Dispatch<React.SetStateAction<MediaFolder | null>>;
  openAllParents: (folder: MediaFolder) => void;
};

function SortableMediaItem({
  media,
  disabled = false,
  editMode,
  setMediaSelected,
  activeFolder,
  setActiveFolder,
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
  const { currentUser } = useContext(AuthContext);
  const { handleDeleteMedia } = useMedia();
  const [showNotAllowed, setShowNotAllowed] = useState(false);
  const dragTimer = useRef<NodeJS.Timeout | null>(null);

  const theme = currentUser?.theme ?? "dark";
  const t = appTheme[theme];

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

  const cursorClass = disabled
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
    // if (!activeFolder) {
    //   const folderFound = mediaFolders.find(
    //     (mediaFolder: MediaFolder) => mediaFolder.id === media.folder_id
    //   );
    //   if (folderFound) {
    //     openAllParents(folderFound);
    //     setActiveFolder(folderFound);
    //   }
    // } else {
    setMediaSelected(media);
    // }
  };

  if (!currentUser) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onClick={handleMediaClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={`relative overflow-visible rounded shadow-sm ${cursorClass} ${
        isDragging ? "shadow-xl" : ""
      }`}
    >
      {editMode && (
        <div
          style={{
            backgroundColor: t.background_1,
            border: "0.5px solid " + t.text_3,
          }}
          className="absolute top-[-8px] right-[-9px] z-[150] w-[26px] h-[26px] flex items-center justify-center dim hover:brightness-75 cursor-pointer rounded-[20px]"
          onClick={async (e: any) => {
            e.stopPropagation();
            if (media.id && media.media_id) {
              await handleDeleteMedia(media.id, media.media_id);
            }
          }}
        >
          <IoCloseOutline color={t.text_2} />
        </div>
      )}
      {media.type === "image" ? (
        <img
          style={{ willChange: "transform" }}
          draggable={false}
          src={media.url}
          alt={media.alt_text || ""}
          className="dim hover:brightness-90 object-cover w-full max-h-[210px] aspect-[1/1]"
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
  filteredMedia: Media[];
  view: "grid" | "list";
  projectId: number;
  activeFolder: MediaFolder | null;
  setActiveFolder: React.Dispatch<React.SetStateAction<MediaFolder | null>>;
  editMode: boolean;
  openAllParents: (folder: MediaFolder) => void;
};

export default function MediaGrid({
  filteredMedia,
  view,
  activeFolder,
  setActiveFolder,
  editMode,
  openAllParents,
}: MediaGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );
  const { currentUser } = useContext(AuthContext);
  const { upsertMedia } = useContextQueries();
  const [localMedia, setLocalMedia] = useState<Media[]>([]);
  const [mediaSelected, setMediaSelected] = useState<Media | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoTime, setVideoTime] = useState({ current: 0, duration: 0 });

  const theme = currentUser?.theme ?? "dark";
  const t = appTheme[theme];

  const originalMediaRef = useRef<Media[]>([]);
  useEffect(() => {
    const sortedMedia = [...filteredMedia].sort(
      (a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0)
    );
    setLocalMedia(sortedMedia);
    originalMediaRef.current = sortedMedia;
  }, [filteredMedia]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    const hoveredFolder = useDnDStore.getState().hoveredFolder;
    useDnDStore.getState().setDraggingItem(null);
    useDnDStore.getState().setHoveredFolder(null);

    if (hoveredFolder) {
      const draggedMediaId = active.id;
      const draggedMedia = localMedia.find(
        (m) => m.media_id === draggedMediaId
      );
      if (draggedMedia) {
        await upsertMedia([
          {
            ...draggedMedia,
            folder_id: hoveredFolder === "-1" ? null : Number(hoveredFolder),
          },
        ]);
      }
      return;
    }
    if (!over || active.id === over.id) return;

    const folderId = activeFolder ? activeFolder.id : null;

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
          (m) => m.media_id === item.media_id
        );
        return idx > -1 ? { ...item, ordinal: idx } : item;
      });
      return newState.sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0));
    });

    const updatedMedia = newSiblingsOrder
      .map((m, idx) => ({ ...m, ordinal: idx }))
      .filter((m) => {
        const original = originalMediaRef.current.find(
          (om) => om.media_id === m.media_id
        );
        return original && original.ordinal !== m.ordinal;
      });
    if (updatedMedia.length > 0) {
      await upsertMedia(updatedMedia);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="w-[100%] h-[100%] relative">
      {mediaSelected && (
        <div
          className="fixed z-[990] top-0 left-0 w-[100%] h-[100%] flex items-center justify-center"
          style={{
            backgroundColor: t.background_1,
          }}
          onClick={() => setMediaSelected(null)}
        >
          {/\.(mp4|mov)$/i.test(mediaSelected.url) ? (
            <div className="relative max-w-[100%] max-h-[100%]">
              <video
                ref={videoRef}
                src={mediaSelected.url}
                className="object-contain max-w-[100%] max-h-[90vh]"
                playsInline
                loop
                autoPlay
                onClick={() => setMediaSelected(null)}
                onTimeUpdate={(e) => {
                  const v = e.currentTarget;
                  setVideoTime({
                    current: v.currentTime,
                    duration: v.duration,
                  });
                }}
              />
              <div
                className="absolute left-0 right-0 bottom-4 px-6"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="range"
                  min={0}
                  max={videoTime.duration || 0}
                  step={0.01}
                  value={videoTime.current || 0}
                  onChange={(e) => {
                    const newTime = parseFloat(e.target.value);
                    if (videoRef.current)
                      videoRef.current.currentTime = newTime;
                    setVideoTime((prev) => ({ ...prev, current: newTime }));
                  }}
                  className="w-full appearance-none bg-transparent cursor-pointer"
                  style={{
                    WebkitAppearance: "none",
                    appearance: "none",
                  }}
                />
                <style jsx>{`
                  input[type="range"] {
                    height: 4px;
                  }
                  input[type="range"]::-webkit-slider-runnable-track {
                    height: 4px;
                    background: #ccc;
                    border-radius: 2px;
                  }
                  input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 14px;
                    width: 14px;
                    border-radius: 50%;
                    background: #d1d5db;
                    margin-top: -5px; /* centers thumb vertically */
                    transition: background 0.2s ease;
                  }
                  input[type="range"]::-webkit-slider-thumb:hover {
                    background: #d1d5db;
                  }
                  input[type="range"]::-moz-range-track {
                    height: 4px;
                    background: #ccc;
                    border-radius: 2px;
                  }
                  input[type="range"]::-moz-range-thumb {
                    height: 14px;
                    width: 14px;
                    border-radius: 50%;
                    background: #d1d5db;
                    border: none;
                    transition: background 0.2s ease;
                  }
                  input[type="range"]::-moz-range-thumb:hover {
                    background: #d1d5db;
                  }
                `}</style>
              </div>
            </div>
          ) : (
            <img
              src={mediaSelected.url}
              className="object-cover max-w-[100%] max-h-[100%]"
            />
          )}
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
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
                key={m.media_id}
                media={m}
                disabled={false}
                editMode={editMode}
                setMediaSelected={setMediaSelected}
                activeFolder={activeFolder}
                setActiveFolder={setActiveFolder}
                openAllParents={openAllParents}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
