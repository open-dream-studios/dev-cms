// project/src/hooks/useMedia.tsx
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { Job, Media, MediaLink, MediaUsage } from "@open-dream/shared";
import { ProjectPage } from "@open-dream/shared";
import { Product } from "@open-dream/shared";
import { getCurrentTimestamp } from "@/util/functions/Data";
import { PopupDisplayItem, useModals } from "./useModals";
import { makeRequest } from "@/util/axios";

export type FileImage = {
  name: string;
  file: File;
};

export function useMedia() {
  const { setUpdatingLock, setUploadContext } = useUiStore();
  const {
    productsData,
    deleteMedia,
    mediaLinks,
    upsertMediaLinks,
    deleteMediaLinks,
    projectPages,
    refetchMedia,
    jobs,
  } = useContextQueries();
  const {
    currentProject,
    currentProjectId,
    currentProductImages,
    setCurrentProductImages,
  } = useCurrentDataStore();
  const { promptContinue } = useModals();

  const handleFileProcessing = async (
    files: File[],
    folder_id: number | null
  ): Promise<Media[]> => {
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
      const response = await makeRequest.post("/api/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
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
      refetchMedia();
    }
  };

  const uploadProductImages = async (
    items: Media[],
    serialNumber: string | null
  ) => {
    if (!currentProjectId) return;
    const matchedProduct = serialNumber
      ? productsData.find(
          (product: Product) => product.serial_number === serialNumber
        )
      : null;
    const newProductImages: MediaLink[] = items
      .filter((m): m is Media & { id: number } => m.id != null)
      .map((m, index) => ({
        entity_type: "product",
        entity_id:
          matchedProduct && matchedProduct.id ? matchedProduct.id : null,
        media_id: m.id,
        url: m.url,
        ordinal: currentProductImages.length + index,
      }));
    setCurrentProductImages([...currentProductImages, ...newProductImages]);
  };

  const saveCurrentProductImages = async (productId: number) => {
    const existingProductImages = mediaLinks.filter(
      (link: MediaLink) =>
        link.entity_type === "product" && link.entity_id === productId
    );
    const linksToDelete = [];
    for (const originalLink of existingProductImages) {
      const stillPresent = currentProductImages.find(
        (currentLink: MediaLink) =>
          currentLink.media_id === originalLink.media_id
      );
      if (!stillPresent && originalLink) {
        // if original list had it and now it is not there, delete media links
        linksToDelete.push(originalLink);
      }
    }
    if (linksToDelete.length) {
      await deleteMediaLinks(linksToDelete);
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
      await upsertMediaLinks(linksToUpdate);
    }
  };

  const saveCurrentJobImages = async (
    jobId: number,
    currentImages: MediaLink[]
  ) => {
    const existingJobImages = mediaLinks.filter(
      (link: MediaLink) =>
        link.entity_type === "job" && link.entity_id === jobId
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
      await upsertMediaLinks(linksToUpdate);
    }
  };

  const handleDeleteMedia = async (id: number, media_id: string) => {
    const mediaUsage = mediaLinks.filter(
      (mediaLink: MediaLink) => mediaLink.media_id === id
    );
    if (!mediaUsage.length) {
      await deleteMedia(media_id);
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
        await deleteMedia(media_id);
        await deleteMediaLinks(usageMediaLinkItems);
      };

      promptContinue(
        "Permanently delete media?",
        false,
        () => {},
        onContinue,
        usageItems
      );
    }
  };

  return {
    uploadProductImages,
    saveCurrentProductImages,
    saveCurrentJobImages,
    handleFileProcessing,
    handleDeleteMedia,
  };
}
