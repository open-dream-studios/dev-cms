// project/src/util/functions/Images.tsx
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { MediaLink } from "@open-dream/shared";

export const preloadImages = (urls: string[]) => {
  urls.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
};

export type ZipImageInput = { url: string; filename?: string };

const mimeToExt: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",

  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

const guessExt = (url: string, contentType?: string) => {
  if (contentType && mimeToExt[contentType]) {
    return mimeToExt[contentType];
  }

  // fallback to URL
  const clean = url.split("?")[0];
  const m = clean.match(/\.([a-zA-Z0-9]+)$/);
  return m?.[1] ?? "bin";
};

export const handleZipDownloadFromUrls = async (
  images: ZipImageInput[],
  zipName: string = "images",
) => {
  if (!images?.length) return;
  console.log(images);

  const zip = new JSZip();

  await Promise.all(
    images.map(async (img, idx) => {
      try {
        const res = await fetch(img.url, { mode: "cors" });
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

        const blob = await res.blob();
        const ext = guessExt(img.url, blob.type);

        const base =
          img.filename?.replace(/\.[^/.]+$/, "") ??
          `media-${String(idx + 1).padStart(2, "0")}`;

        zip.file(`${base}.${ext}`, blob);
      } catch (e) {
        console.error("ZIP DOWNLOAD FAILED:", img.url, e);
      }
    }),
  );

  const zipBlob = await zip.generateAsync({
    type: "blob",
    streamFiles: true,
    mimeType: "application/zip",
  });
  saveAs(zipBlob, `${zipName}.zip`);
};

export const handleZipDownload = async (
  currentProductImages: MediaLink[],
  zipName: string = "product-images",
) => {
  if (!currentProductImages?.length) return;
  await handleZipDownloadFromUrls(
    currentProductImages.map((mediaLink: MediaLink, index: number) => ({
      url: mediaLink.url,
      filename: `img-${index + 1}`,
    })),
    zipName,
  );
};
