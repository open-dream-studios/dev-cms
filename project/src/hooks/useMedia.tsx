// project/src/hooks/useMedia.tsx
import { CloudinaryUpload } from "@/components/Upload/Upload";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { Media, MediaLink } from "@/types/media";
import { Product } from "@/types/products";
import { getCurrentTimestamp } from "@/util/functions/Data";
import axios from "axios";

export type FileImage = {
  name: string;
  file: File;
};

export function useMedia() {
  const { setUpdatingLock, setUploadPopup } = useUiStore();
  const {
    productsData,
    upsertMedia,
    refetchMedia,
    mediaLinks,
    upsertMediaLinks,
    deleteMediaLinks,
    refetchMediaLinks,
  } = useContextQueries();
  const {
    currentProjectId,
    currentProductImages,
    setCurrentProductImages,
    originalProductImages,
  } = useCurrentDataStore();

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
    const existingProductMediaLinks = matchedProduct
      ? mediaLinks.filter(
          (m: MediaLink) =>
            m.entity_type === "product" && m.entity_id === matchedProduct.id
        )
      : [];
    const newMediaInsert = uploadObjects.map((upload: CloudinaryUpload) => {
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

    const newMedia = await upsertMedia(newMediaInsert);
    refetchMedia();

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
    console.log("DEL", linksToDelete);
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
    console.log("UPSERT", linksToUpdate);
    if (linksToUpdate.length) {
      await upsertMediaLinks(linksToUpdate);
    }
  };

  // if (productIds && productIds.length && imagesChanged) {
  //   await saveCurrentProductImages(productIds[0])
  //   // Handle deletion of stored media links
  //   const originalStoredLinkIds = mediaLinks
  //     .filter(
  //       (link: MediaLink) =>
  //         link.entity_id === productIds[0] && link.entity_type === "product"
  //     )
  //     .map((item) => item.id as number);

  //   const finalStoredLinkIds = currentProductImages.map((item) => item.id);

  //   const removedIds = originalStoredLinkIds.filter(
  //     (id) => !finalStoredLinkIds.includes(id)
  //   );

  //   if (removedIds.length > 0) {
  //     await deleteMediaLinks(removedIds);
  //   }

  //   const updatedImages = currentProductImages.map((img) => ({
  //     ...img,
  //     entity_id: productIds[0],
  //   }));
  //   await upsertMediaLinks(updatedImages);
  // }

  return {
    uploadProductImages,
    saveCurrentProductImages,
    handleSend,
    handleFileProcessing,
  };
}
