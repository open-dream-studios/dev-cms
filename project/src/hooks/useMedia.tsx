// project/src/hooks/useMedia.tsx
import { CloudinaryUpload } from "@/components/Upload/Upload";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { Media, MediaLink } from "@shared/types/models/media";
import { ProjectPage } from "@shared/types/models/pages";
import { Product } from "@shared/types/models/products";
import { getCurrentTimestamp } from "@/util/functions/Data";
import axios from "axios";
import { PopupDisplayItem, useModals } from "./useModals";

export type FileImage = {
  name: string;
  file: File;
};

export function useMedia() {
  const { setUpdatingLock, setUploadPopup } = useUiStore();
  const {
    productsData,
    upsertMedia,
    deleteMedia,
    mediaLinks,
    upsertMediaLinks,
    deleteMediaLinks,
    projectPages,
  } = useContextQueries();
  const { currentProjectId, currentProductImages, setCurrentProductImages } =
    useCurrentDataStore();
  const { promptContinue } = useModals();

  const handleSend = async (files: FileImage[]) => {
    const formData = new FormData();
    files.forEach((fileImage) => {
      formData.append("files", fileImage.file, fileImage.name);
    });

    try {
      const response = await axios.post("/api/media/compress", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
        const uploadedFiles = response.data.files;
        return uploadedFiles;
      } else {
        return [];
      }
    } catch (error) {
      console.error("Upload error:", error);
      return [];
    }
  };

  const handleFileProcessing = async (
    files: File[]
  ): Promise<CloudinaryUpload[]> => {
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
      setUploadPopup(false);
      const uploadObjects = await handleSend(images);
      return uploadObjects;
    } catch (err) {
      console.error("Error processing files:", err);
      return [];
    } finally {
      setUpdatingLock(false);
    }
  };

  const uploadProductImages = async (
    uploadObjects: CloudinaryUpload[],
    serialNumber: string | null
  ) => {
    if (!currentProjectId) return;
    const matchedProduct = serialNumber
      ? productsData.find(
          (product: Product) => product.serial_number === serialNumber
        )
      : null;

    const newMediaInserts = uploadObjects.map((upload: CloudinaryUpload) => {
      return {
        media_id: null,
        project_idx: currentProjectId,
        public_id: upload.public_id,
        url: upload.url,
        type: upload.metadata.duration ? "video" : "image",
        folder_id: null,
        media_usage: "product",
        tags: null,
        ordinal: null,
      } as Media;
    });

    const newMedia = await upsertMedia(newMediaInserts);

    const newProductImages: MediaLink[] = newMedia
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

    let linksToDelete = [];
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

    let linksToUpdate = [];
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

  const handleDeleteMedia = async (id: number, media_id: string) => {
    const mediaUsage = mediaLinks.filter(
      (mediaLink: MediaLink) => mediaLink.media_id === id
    );
    if (!mediaUsage.length) {
      await deleteMedia(media_id);
    } else {
      const usageItems: PopupDisplayItem[] = [];
      const usageMediaLinkItems: MediaLink[] = [];
      for (let usage of mediaUsage) {
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
    handleSend,
    handleFileProcessing,
    handleDeleteMedia,
  };
}
