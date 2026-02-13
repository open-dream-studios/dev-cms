// project/src/modules/MediaModule/MediaFoldersSidebar.tsx
"use client";
import { useContext, useEffect, useMemo, useRef } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import { Folder } from "lucide-react"; 
import { FolderScope, ProjectFolder } from "@open-dream/shared";
import { AuthContext } from "@/contexts/authContext";
import Divider from "@/lib/blocks/Divider";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { motion } from "framer-motion";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { useUiStore } from "@/store/useUIStore";
import {
  resetDragUI,
  setSelectedFolderForScope,
  useFoldersCurrentDataStore,
} from "../_util/Folders/_store/folders.store";
import { folderDndCollisions } from "../_util/Folders/_helpers/folders.helpers";
import {
  useFolderDndHandlers,
  useProjectFolderHooks,
} from "../_util/Folders/_hooks/folders.hooks";
import { openFolder } from "../_util/Folders/_actions/folders.actions";
import { useProjectFolders } from "@/contexts/queryContext/queries/projectFolders";
import FolderTree from "../_util/Folders/FolderTree";
import { FolderItemDisplay } from "../_util/Folders/FolderItemDisplay";

export default function MediaFoldersSidebar() {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { hoveredFolder, setHoveredFolder } = useUiStore();
  const { currentProjectId } = useCurrentDataStore();
  const { draggingFolderId } = useFoldersCurrentDataStore();

  const isDraggedOver = hoveredFolder === "-1";

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      const folders =
        document.querySelectorAll<HTMLElement>("[data-folder-id]");
      let hovered: string | null = null;

      folders.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          hovered = el.dataset.folderId ?? null;
        }
      });

      const topBar = document.querySelector<HTMLElement>("[data-folders-top]");
      if (topBar) {
        const rect = topBar.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          hovered = "-1";
        }
      }

      setHoveredFolder(hovered);
    }

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  const folderScope = "media" as FolderScope;
  const folderDnd = useFolderDndHandlers(folderScope);
  const { handleAddFolder } = useProjectFolderHooks(folderScope);
  const dragStartPointerRef = useRef<{ x: number; y: number } | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
  );
  const { projectFolders } = useProjectFolders(
    !!currentUser,
    currentProjectId!,
    {
      scope: folderScope as FolderScope,
      process_id: null,
    },
  );

  const draggingFolder = useMemo(() => {
    const result = projectFolders.find(
      (folder: ProjectFolder) => folder.folder_id === draggingFolderId,
    );
    return result;
  }, [projectFolders, draggingFolderId]);

  if (!currentUser) return null;

  return (
    <div
      className="w-60 h-[100%] flex flex-col"
      style={{
        borderRight: `0.5px solid ${currentTheme.background_2}`,
      }}
    >
      <motion.div
        data-folders-top={-1}
        className={
          "px-[15px] flex flex-row items-center justify-between pt-[12px] pb-[6px] h-[61px]"
        }
        animate={{
          backgroundColor: isDraggedOver
            ? currentTheme.background_2
            : currentTheme.background_1,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="flex flex-row gap-[13.5px] items-center w-[100%]">
          <p
            onClick={() =>
              setSelectedFolderForScope(folderScope as FolderScope, null)
            }
            className="cursor-pointer hover:opacity-[75%] transition-all duration-300 ease-in-out w-[100%] font-[600] h-[40px] truncate text-[24px] leading-[30px] mt-[1px]"
          >
            Media
          </p>
        </div>

        <div
          data-leftbar-button
          onClick={() => handleAddFolder(folderScope)}
          className="dim cursor-pointer hover:brightness-[85%] min-w-[30px] w-[30px] h-[30px] mt-[-5px] rounded-full flex justify-center items-center"
          style={{
            backgroundColor: currentTheme.background_1_3,
          }}
        >
          <Folder size={13} />
        </div>
      </motion.div>

      <div className="w-[100%] px-[15px] mt-[-1px]">
        <Divider mb={10} />
      </div>

      <div className="px-[15px] flex-1 overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={folderDndCollisions}
          onDragStart={(e) => {
            resetDragUI();
            const evt = e.activatorEvent as PointerEvent;
            dragStartPointerRef.current = {
              x: evt.clientX,
              y: evt.clientY,
            };
            const data = e.active.data.current;
            if (data?.kind === "FOLDER") {
              folderDnd.onDragStart(e);
            }
          }}
          onDragEnd={async (e) => {
            const activeData = e.active.data.current;
            const overData = e.over?.data.current;

            if (activeData?.kind === "FOLDER" && overData?.kind === "FOLDER") {
              folderDnd.onDragEnd(e);
              return;
            }

            const active = e.active.data.current;
            const over = e.over?.data.current;

            if (
              active?.kind.startsWith("FOLDER-ITEM") &&
              over?.kind === "FOLDER" &&
              over.folder.id !== active.item.folder_id
            ) {
              const normalizedFolderId =
                over.folder.id === -1 ? null : over.folder.id;

              if (normalizedFolderId) {
                const foundFolder = projectFolders.find(
                  (folder: ProjectFolder) => folder.id === normalizedFolderId,
                );
                if (foundFolder) {
                  openFolder(foundFolder);
                }
              }
            }
            dragStartPointerRef.current = null;
            resetDragUI();
          }}
          onDragCancel={(e) => {
            folderDnd.onDragCancel();
            dragStartPointerRef.current = null;
            resetDragUI();
          }}
        >
          <FolderTree folderScope={folderScope} />

          <DragOverlay>
            {draggingFolder && (
              <FolderItemDisplay
                scope={draggingFolder.scope}
                isGhost={true}
                node={null}
                name={draggingFolder.name}
                depth={0}
                listeners={null}
                outline={false}
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
