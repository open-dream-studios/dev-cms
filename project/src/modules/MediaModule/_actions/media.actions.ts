// project/src/modules/MediaModule/_actions/media.actions.ts
import { useCurrentDataStore } from "@/store/currentDataStore";
import {
  ContextMenuDefinition,
  Job,
  Media,
  MediaFolder,
  MediaLink,
  Product,
  ProjectPage,
} from "@open-dream/shared";
import { useMediaModuleUIStore } from "../_store/media.store";
import { deleteMediaFolderApi } from "@/api/mediaFolders.api";
import { setUploadContext, useUiStore } from "@/store/useUIStore";
import { getCurrentTimestamp } from "@/util/functions/Data"; 
import { deleteMediaLinksApi, upsertMediaLinksApi } from "@/api/mediaLinks.api";
import { deleteProjectMediaApi, rotateProjectMediaApi } from "@/api/media.api";
import { showSuccessToast } from "@/util/functions/UI";
import {
  PopupDisplayItem,
  promptContinue,
} from "@/modals/_actions/modals.actions";
import { queryClient } from "@/lib/queryClient";
import axios from "axios";

export type FileImage = {
  name: string;
  file: File;
};

export const createFolderContextMenu =
  (): ContextMenuDefinition<MediaFolder> => ({
    items: [
      {
        id: "delete-folder",
        label: "Delete Folder",
        danger: true,
        onClick: async (folder) => {
          await handleDeleteFolder(folder.folder_id);
        },
      },
      {
        id: "rename-folder",
        label: "Rename Folder",
        danger: true,
        onClick: async (folder) => {
          await handleRenameFolder(folder.folder_id);
        },
      },
    ],
  });

export const handleDeleteFolder = async (folder_id: string | null) => {
  const { currentProjectId, setCurrentActiveFolder, currentActiveFolder } =
    useCurrentDataStore.getState();
  if (!currentProjectId || !folder_id) return;
  await deleteMediaFolderApi(currentProjectId, folder_id);
  if (currentActiveFolder && currentActiveFolder.folder_id === folder_id) {
    setCurrentActiveFolder(null);
  }
  queryClient.invalidateQueries({ queryKey: ["media", currentProjectId] });
  queryClient.invalidateQueries({
    queryKey: ["mediaFolders", currentProjectId],
  });
};

const handleRenameFolder = async (folder_id: string | null) => {
  if (!folder_id) return;
  const { setRenamingFolder } = useMediaModuleUIStore.getState();
  setRenamingFolder(folder_id);
};

export const handleFileProcessing = async (
  files: File[],
  folder_id: number | null
): Promise<Media[]> => {
  const { currentProject, currentProjectId } = useCurrentDataStore.getState();
  const { setUpdatingLock } = useUiStore.getState();
  if (!currentProject || !currentProject.project_id || !currentProjectId)
    return [];
  setUpdatingLock(true);
  try {
    const uploadedNames: string[] = [];
    const readerPromises = files.map(
      (file) =>
        new Promise<FileImage>((resolve) => {
          const extension = file.type.split("/").pop() ?? "png";
          const timeStamp = getCurrentTimestamp();
          const sanitizedFileName = `${timeStamp}--${file.name.replace(
            /[^a-zA-Z0-9]/g,
            "_"
          )}.${extension}`;
          uploadedNames.push(sanitizedFileName);
          resolve({ name: sanitizedFileName, file });
        })
    );
    const images = await Promise.all(readerPromises);
    setUploadContext((prev) => (prev ? { ...prev, visible: false } : prev));
    const formData = new FormData();
    formData.append("projectId", currentProject.project_id);
    formData.append("project_idx", String(currentProjectId));
    formData.append("folder_id", String(folder_id));
    images.forEach((fileImage) => {
      formData.append("files", fileImage.file, fileImage.name);
    }); 
    const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/media/upload`, formData, {
      withCredentials: true,
    });

    if (response.status === 200) {
      return response.data.media;
    } else {
      return [];
    }
  } catch (err) {
    console.error("Error processing files:", err);
    return [];
  } finally {
    setUpdatingLock(false);
    queryClient.invalidateQueries({
      queryKey: ["media", currentProjectId],
    });
  }
};

export const uploadProductImages = async (
  items: Media[],
  serialNumber: string | null
) => {
  const { currentProductImages, setCurrentProductImages, currentProjectId } =
    useCurrentDataStore.getState();
  if (!currentProjectId) return;
  const productsData = queryClient.getQueryData<Product[]>([
    "products",
    currentProjectId,
  ]);
  if (!productsData) return;
  const matchedProduct = serialNumber
    ? productsData.find(
        (product: Product) => product.serial_number === serialNumber
      )
    : null;
  const newProductImages: MediaLink[] = items
    .filter((m): m is Media & { id: number } => m.id != null)
    .map((m, index) => ({
      entity_type: "product",
      entity_id: matchedProduct && matchedProduct.id ? matchedProduct.id : null,
      media_id: m.id,
      url: m.url,
      ordinal: currentProductImages.length + index,
    }));
  setCurrentProductImages([...currentProductImages, ...newProductImages]);
};

export const saveCurrentProductImages = async (productId: number) => {
  const { currentProductImages, currentProjectId } =
    useCurrentDataStore.getState();
  if (!currentProjectId) return;
  const mediaLinks = queryClient.getQueryData<MediaLink[]>([
    "mediaLinks",
    currentProjectId,
  ]);
  if (!mediaLinks) return;
  const existingProductImages = mediaLinks.filter(
    (link: MediaLink) =>
      link.entity_type === "product" && link.entity_id === productId
  );
  const linksToDelete = [];
  for (const originalLink of existingProductImages) {
    const stillPresent = currentProductImages.find(
      (currentLink: MediaLink) => currentLink.media_id === originalLink.media_id
    );
    if (!stillPresent && originalLink) {
      // if original list had it and now it is not there, delete media links
      linksToDelete.push(originalLink);
    }
  }
  if (linksToDelete.length) {
    await deleteMediaLinksApi(currentProjectId, linksToDelete);
  }

  const linksToUpdate = [];
  for (const link of currentProductImages) {
    // if already existed and didn't change, do nothing
    const existing = existingProductImages.find(
      (originalLink: MediaLink) => originalLink.media_id === link.media_id
    );
    if (!existing || (existing && existing.ordinal !== link.ordinal)) {
      // if already existed and did change or didn't exist, upsert
      linksToUpdate.push({
        ...link,
        entity_id: productId,
      });
    }
  }
  if (linksToUpdate.length) {
    await upsertMediaLinksApi(currentProjectId, linksToUpdate);
  }
  queryClient.invalidateQueries({
    queryKey: ["mediaLinks", currentProjectId],
  });
};

export const saveCurrentJobImages = async (
  jobId: number,
  currentImages: MediaLink[]
) => {
  const { currentProjectId } = useCurrentDataStore.getState();
  if (!currentProjectId) return;
  const mediaLinks = queryClient.getQueryData<MediaLink[]>([
    "mediaLinks",
    currentProjectId,
  ]);
  if (!mediaLinks) return;
  const existingJobImages = mediaLinks.filter(
    (link: MediaLink) => link.entity_type === "job" && link.entity_id === jobId
  );
  const linksToUpdate = [];
  for (const link of currentImages) {
    const existing = existingJobImages.find(
      (originalLink: MediaLink) => originalLink.media_id === link.media_id
    );
    if (!existing || (existing && existing.ordinal !== link.ordinal)) {
      linksToUpdate.push({
        ...link,
        entity_id: jobId,
      });
    }
  }
  if (linksToUpdate.length) {
    await upsertMediaLinksApi(currentProjectId, linksToUpdate);
  }
  queryClient.invalidateQueries({
    queryKey: ["mediaLinks", currentProjectId],
  });
};

export const handleDeleteMedia = async (id: number, media_id: string) => {
  const { currentProjectId } = useCurrentDataStore.getState();
  if (!currentProjectId) return;
  const productsData = queryClient.getQueryData<Product[]>([
    "products",
    currentProjectId,
  ]);
  const mediaLinks = queryClient.getQueryData<MediaLink[]>([
    "mediaLinks",
    currentProjectId,
  ]);
  const projectPages = queryClient.getQueryData<ProjectPage[]>([
    "projectPages",
    currentProjectId,
  ]);
  const jobs = queryClient.getQueryData<Job[]>(["jobs", currentProjectId]);
  if (!mediaLinks || !productsData || !projectPages || !jobs) return;

  const mediaUsage = mediaLinks.filter(
    (mediaLink: MediaLink) => mediaLink.media_id === id
  );
  if (!mediaUsage.length) {
    await deleteProjectMediaApi(currentProjectId, media_id);
  } else {
    const usageItems: PopupDisplayItem[] = [];
    const usageMediaLinkItems: MediaLink[] = [];
    for (const usage of mediaUsage) {
      if (usage.entity_id) {
        if (usage.entity_type === "product") {
          const matchedProduct = productsData.find(
            (product: Product) => product.id === usage.entity_id
          );
          if (matchedProduct && matchedProduct.serial_number) {
            usageItems.push({
              id: usage.entity_id,
              type: usage.entity_type,
              title: matchedProduct.serial_number,
            });
            usageMediaLinkItems.push(usage);
          }
        } else if (usage.entity_type === "page") {
          const matchedPage = projectPages.find(
            (page: ProjectPage) => page.id === usage.entity_id
          );
          if (matchedPage && matchedPage.title) {
            usageItems.push({
              id: usage.entity_id,
              type: usage.entity_type,
              title: matchedPage.title,
            });
            usageMediaLinkItems.push(usage);
          }
        } else if (usage.entity_type === "job") {
          const matchedJob = jobs.find(
            (job: Job) => job.id === usage.entity_id
          );
          if (matchedJob && matchedJob.job_id) {
            usageItems.push({
              id: usage.entity_id,
              type: usage.entity_type,
              title: matchedJob.job_id,
            });
            usageMediaLinkItems.push(usage);
          }
        }
      }
    }

    const onContinue = async () => {
      await deleteProjectMediaApi(currentProjectId, media_id);
      await deleteMediaLinksApi(currentProjectId, usageMediaLinkItems);
    };

    promptContinue(
      "Permanently delete media?",
      false,
      () => {},
      onContinue,
      usageItems
    );
  }
  queryClient.invalidateQueries({
    queryKey: ["media", currentProjectId],
  });
  queryClient.invalidateQueries({
    queryKey: ["mediaLinks", currentProjectId],
  });
};

export const handleRotateMedia = async (
  media_id: string,
  url: string,
  rotations: number
) => {
  const { setUpdatingLock } = useUiStore.getState();
  const { currentProjectId } = useCurrentDataStore.getState();
  if (!currentProjectId) return;
  try {
    setUpdatingLock(true);
    await rotateProjectMediaApi(currentProjectId, media_id, url, rotations);
    showSuccessToast("rotate-success", "Image rotated");
    queryClient.invalidateQueries({
      queryKey: ["media", currentProjectId],
    });
    queryClient.invalidateQueries({
      queryKey: ["mediaLinks", currentProjectId],
    });
  } catch (err) {
    console.error(err);
  } finally {
    setUpdatingLock(false);
  }
};
