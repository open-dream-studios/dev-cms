// project/src/components/Upload/Upload.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import { useAppContext } from "@/contexts/appContext";
import { appTheme } from "@/util/appTheme";
import React, { useContext, useState } from "react";
import { IoCloseOutline } from "react-icons/io5";

export type CloudinaryUpload = {
  metadata: {
    duration: number | null;
    extension: string;
    height: number;
    size: number;
    width: number;
  };
  public_id: string;
  url: string;
};

interface UploadProps {
  handleFiles: (files: File[]) => void;
  multiple?: boolean;
}

type UploadModalProps = {
  onUploaded: (cloudinaryUploads: CloudinaryUpload[], files: File[]) => void;
  multiple?: boolean;
  onClose: () => void;
};

function UploadModal({
  onUploaded,
  multiple = true,
  onClose,
}: UploadModalProps) {
  const { currentUser } = useContext(AuthContext);
  const { handleFileProcessing, uploadPopup, setUploadPopup, uploadPopupRef } =
    useAppContext();

  if (!currentUser) return null;

  const handleFiles = async (files: File[]) => {
    const filtered = multiple ? files : files.slice(0, 1);
    const uploadedImages = await handleFileProcessing(filtered);
    if (uploadedImages.length > 0) {
      onUploaded(multiple ? uploadedImages : [uploadedImages[0]], filtered);
    }
  };

  return (
    <>
      {uploadPopup && (
        <div className="z-[999] fixed top-0 left-0">
          <div
            className="absolute top-0 w-[100vw] display-height"
            style={{ backgroundColor: "black", opacity: 0.4 }}
          />
          <div className="absolute top-0 w-[100vw] display-height flex items-center justify-center">
            <div
              ref={uploadPopupRef}
              className="shadow-lg w-[85%] sm:w-[70%] aspect-[1/1.2] sm:aspect-[1.5/1] relative"
            >
              <Upload handleFiles={handleFiles} multiple={multiple} />
              <IoCloseOutline
                size={35}
                color={appTheme[currentUser.theme].text_4}
                onClick={() => setUploadPopup(false)}
                className="cursor-pointer hover:brightness-75 dim absolute top-[15px] right-[19px]"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const Upload: React.FC<UploadProps> = ({ handleFiles, multiple = true }) => {
  const { currentUser } = useContext(AuthContext);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(multiple ? files : files.slice(0, 1));
  };

  if (!currentUser) return null;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: appTheme[currentUser.theme].background_stark,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background-color 0.3s",
        border:
          currentUser.theme === "light"
            ? dragging
              ? "3px dashed blue"
              : "none"
            : "1px solid #333",
        borderRadius: "28px",
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragging(false);
      }}
      onDrop={handleDrop}
    >
      <p
        className="absolute font-[300]"
        style={{
          fontSize: "1.2rem",
          color:
            currentUser.theme === "light"
              ? dragging
                ? "blue"
                : "black"
              : "#fff",
        }}
      >
        Drag and drop {multiple ? "images" : "an image"} here
      </p>

      <div className="relative w-[100%] h-[100%] flex justify-center">
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.mp4,.mov,.avi"
          multiple={multiple}
          style={{ display: "none" }}
          id="fileInput"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            handleFiles(multiple ? files : files.slice(0, 1));
          }}
        />
        <label
          className="absolute bottom-[20px]"
          htmlFor="fileInput"
          style={{
            marginTop: "20px",
            cursor: "pointer",
            textDecoration: "underline",
            color: currentUser.theme === "dark" ? "#eee" : "blue",
          }}
        >
          Open Finder
        </label>
      </div>
    </div>
  );
};

export default UploadModal;
