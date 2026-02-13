// // project/src/modules/_util/Folders/FolderTree.tsx
// "use client";
// import { useOutsideClick } from "@/hooks/util/useOutsideClick";
// import { flattenFromNormalizedTree } from "@/modules/_util/Folders/_helpers/folders.helpers";
// import React, { useMemo, useRef } from "react";
// import {
//   setSelectedFolderForScope,
//   useFoldersCurrentDataStore,
// } from "./_store/folders.store";
// import DraggableFolderItem from "@/modules/_util/Folders/DraggableFolderItem";
// import { FolderScope } from "@open-dream/shared";
// import {
//   SortableContext,
//   verticalListSortingStrategy,
// } from "@dnd-kit/sortable";
// import { useSyncFolderTree } from "./_hooks/folders.hooks";

// const FolderTree = ({ folderScope }: { folderScope: FolderScope }) => {
//   const { folderTreesByScope, currentOpenFolders } =
//     useFoldersCurrentDataStore();
//   useSyncFolderTree(folderScope);

//   const flat = useMemo(() => {
//     const tree = folderTreesByScope[folderScope];
//     if (!tree) return [];
//     return flattenFromNormalizedTree(tree, currentOpenFolders);
//   }, [folderScope, folderTreesByScope, currentOpenFolders]);

//   const containerRef = useRef<HTMLDivElement>(null);
//   useOutsideClick(containerRef, (e: React.PointerEvent) => {
//     const el = e.target as HTMLElement;
//     if (
//       el.closest("[data-folder-item]") ||
//       el.closest("[data-leftbar-button]") ||
//       el.closest("[data-modal]")
//     ) {
//       return;
//     }
//     setSelectedFolderForScope(folderScope, null);
//   });

//   return (
//     <div
//       ref={containerRef}
//       className="px-[4px] flex-1 overflow-y-auto w-full pt-[1px]"
//     >
//       <SortableContext
//         items={flat.filter((f) => f.type === "folder").map((f) => f.id)}
//         strategy={verticalListSortingStrategy}
//       >
//         {flat.map((f, index) => {
//           if (f.type === "folder") {
//             return (
//               <DraggableFolderItem key={f.id} flat={f} scope={folderScope} />
//             );
//           }

//           // return (
//           // <div key={f.id} style={{ marginLeft: `${f.depth * 10}px` }}>
//           //   {folderScope === "estimation_fact_definition" && (
//           //     <VariableDraggableItem
//           //       fact={f.item as EstimationFactDefinition}
//           //     />
//           //   )}
//           //   {folderScope === "estimation_process" && (
//           //     <ProcessDraggableItem
//           //       index={index}
//           //       estimationProcess={f.item as EstimationProcess}
//           //     />
//           //   )}
//           // </div>

//           // );
//         })}
//       </SortableContext>
//     </div>
//   );
// };

// export default FolderTree;

"use client";
import { useOutsideClick } from "@/hooks/util/useOutsideClick";
import { flattenFromNormalizedTree } from "@/modules/_util/Folders/_helpers/folders.helpers";
import React, { useMemo, useRef } from "react";
import {
  FlatNode,
  setSelectedFolderForScope,
  useFoldersCurrentDataStore,
} from "./_store/folders.store";
import DraggableFolderItem from "@/modules/_util/Folders/DraggableFolderItem";
import VariableDraggableItem from "@/modules/EstimationModule/components/VariableDraggableItem";
import ProcessDraggableItem from "@/modules/EstimationModule/components/ProcessDraggableItem";
import { EstimationProcess } from "@/api/estimations/process/estimationProcess.api";
import { EstimationFactDefinition, FolderScope } from "@open-dream/shared";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSyncFolderTree } from "./_hooks/folders.hooks";
import { CSS } from "@dnd-kit/utilities";

const FolderTree = ({ folderScope }: { folderScope: FolderScope }) => {
  const { folderTreesByScope, currentOpenFolders } =
    useFoldersCurrentDataStore();

  useSyncFolderTree(folderScope);

  const flat = useMemo(() => {
    const tree = folderTreesByScope[folderScope];
    if (!tree) return [];
    return flattenFromNormalizedTree(tree, currentOpenFolders);
  }, [folderScope, folderTreesByScope, currentOpenFolders]);

  // const folderIds = flat.filter((f) => f.type === "folder").map((f) => f.id);
  const allIds = flat.map((f) => f.id);

  const containerRef = useRef<HTMLDivElement>(null);

  useOutsideClick(containerRef, (e: React.PointerEvent) => {
    const el = e.target as HTMLElement;
    if (
      el.closest("[data-folder-item]") ||
      el.closest("[data-leftbar-button]") ||
      el.closest("[data-modal]")
    ) {
      return;
    }
    setSelectedFolderForScope(folderScope, null);
  });

  return (
    <div
      ref={containerRef}
      className="px-[4px] flex-1 overflow-y-auto w-full pt-[1px]"
    >
      <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
        {flat.map((f, index) => {
          if (f.type === "folder") {
            return (
              <DraggableFolderItem key={f.id} flat={f} scope={folderScope} />
            );
          }

          return (
            <SortableStaticItem
              key={f.id}
              flat={f}
              scope={folderScope}
              index={index}
            />
            // <div
            //   key={f.id}
            //   style={{ marginLeft: `${f.depth * 10}px` }}
            // >
            //   {folderScope === "estimation_fact_definition" && (
            //     <VariableDraggableItem
            //       fact={f.item as EstimationFactDefinition}
            //     />
            //   )}
            //   {folderScope === "estimation_process" && (
            //     <ProcessDraggableItem
            //       index={index}
            //       estimationProcess={f.item as EstimationProcess}
            //     />
            //   )}
            // </div>
          );
        })}
      </SortableContext>
    </div>
  );
};

const SortableStaticItem = ({
  flat,
  scope,
  index,
}: {
  flat: Extract<FlatNode, { type: "item" }>;
  scope: FolderScope;
  index: number;
}) => {
  const { setNodeRef, transform, transition } = useSortable({
    id: flat.id,
    disabled: true,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        marginLeft: `${flat.depth * 10}px`,
      }}
    >
      {scope === "estimation_fact_definition" && (
        <VariableDraggableItem fact={flat.item as EstimationFactDefinition} />
      )}
      {scope === "estimation_process" && (
        <ProcessDraggableItem
          index={index}
          estimationProcess={flat.item as EstimationProcess}
        />
      )}
    </div>
  );
};

export default FolderTree;
