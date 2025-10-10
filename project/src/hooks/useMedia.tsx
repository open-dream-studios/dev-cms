// project/src/hooks/useMedia.tsx
import { CloudinaryUpload } from "@/components/Upload/Upload";
import { useUiStore } from "@/store/UIStore";
import { getCurrentTimestamp } from "@/util/functions/Data";
import axios from "axios";

export type FileImage = {
  name: string;
  file: File;
};

export function useMedia() {
  const { setUpdatingLock, setUploadPopup } = useUiStore();

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

  return {
    handleSend,
    handleFileProcessing,
  };
}
