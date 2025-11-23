// server/functions/media.ts
import sharp from "sharp";
import path from "path";
import fs from "fs";
import fsp from "fs/promises";
import { existsSync } from "fs";
import mime from "mime-types";
import axios from "axios";
import { uploadFileToS3, extractS3KeyFromUrl } from "../services/aws/S3.js";
import { getDecryptedIntegrationsFunction } from "../handlers/integrations/integrations_repositories.js";

export function getContentTypeAndExt(filename: string) {
  const cleanName = filename.split("?")[0].split("#")[0];
  let ext = path
    .extname(cleanName || "")
    .toLowerCase()
    .replace(".", "");
  if (ext.includes("+")) {
    ext = ext.split("+")[0];
  }
  const mimeType = mime.lookup(ext) || "application/octet-stream";
  const correctedMimeMap: Record<string, string> = {
    svg: "image/svg+xml",
    svgz: "image/svg+xml",
    mov: "video/quicktime",
    qt: "video/quicktime",
    quicktime: "video/quicktime",
    mp4: "video/mp4",
    m4v: "video/mp4",
  };
  const finalMimeType = correctedMimeMap[ext] || mimeType;
  return { ext, mimeType: finalMimeType };
}

/**
 * Compress an image file using sharp.
 * - Resizes to maxWidth if specified
 * - Converts to webp when possible
 * - Returns { outputPath, width, height, size, ext, mimeType }
 *
 * If the file is already webp and maxWidth/quality wouldn't change, it can short-circuit.
 */
export async function compressImage({
  inputPath,
  maxWidth = 1200,
  quality = 90,
  convertToWebp = true,
}: {
  inputPath: string;
  maxWidth: number;
  quality: number;
  convertToWebp: boolean;
}) {
  let inputExt = path.extname(inputPath).toLowerCase().replace(".", "");

  const origStats = await fsp.stat(inputPath).catch(() => null);
  if (!origStats) {
    throw new Error("compressImage: input file does not exist");
  }

  // safe metadata read
  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(inputPath).metadata();
  } catch (err) {
    // sharp couldn't read the file — return original
    return {
      outputPath: inputPath,
      width: null,
      height: null,
      size: origStats.size,
      ext: inputExt,
      mimeType: mime.lookup(inputExt) || "application/octet-stream",
      transformed: false,
    };
  }

  if (metadata.format && metadata.format.toLowerCase() !== inputExt) {
    inputExt = metadata.format.toLowerCase();
  }

  const width = metadata.width ?? null;
  const height = metadata.height ?? null;

  // If animated (multi-page) or other complex features, skip transformation
  if (metadata.pages && metadata.pages > 1) {
    return {
      outputPath: inputPath,
      width,
      height,
      size: origStats.size,
      ext: inputExt,
      mimeType: metadata.format
        ? `image/${metadata.format}`
        : mime.lookup(inputExt) || "application/octet-stream",
      transformed: false,
    };
  }

  // Decide final extension and pipeline
  const finalExt = convertToWebp ? "webp" : inputExt;
  const base = path.basename(inputPath, path.extname(inputPath));
  const outName = `${base}-compressed.${finalExt}`;
  const outputPath = path.join(path.dirname(inputPath), outName);

  // Build pipeline
  let pipeline = sharp(inputPath).rotate(); // auto-orient

  if (maxWidth && width && width > maxWidth) {
    pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
  }

  // Apply encoder options depending on finalExt
  try {
    if (finalExt === "webp") {
      const hasAlpha = !!metadata.hasAlpha;
      const isPng = inputExt === "png";

      // For PNGs with transparency, prefer lossless WebP
      if (isPng && hasAlpha) {
        pipeline = pipeline.webp({ lossless: true });
      } else {
        // For other images, use lossy WebP
        pipeline = pipeline.webp({ quality });
      }
    } else if (finalExt === "avif") {
      pipeline = pipeline.avif
        ? pipeline.avif({ quality })
        : pipeline.webp({ quality });
    } else if (finalExt === "jpeg" || finalExt === "jpg") {
      pipeline = pipeline.jpeg({ quality });
    } else if (finalExt === "png") {
      // png quality in sharp expects compressionLevel; but .png({ quality }) is accepted in some builds.
      // Use sensible defaults: keep palette reduction off, let sharp choose.
      pipeline = pipeline.png();
    } else {
      // fallback: try to write webp if convertToWebp set; otherwise write original ext via toFormat
      pipeline = pipeline.toFormat(finalExt as keyof sharp.FormatEnum);
    }

    await pipeline.toFile(outputPath);
  } catch (err) {
    // If transformation fails for any reason, return original (do not throw)
    console.warn("sharp transformation failed, returning original:", err);
    // If a partial output file exists, remove it (best-effort)
    try {
      if (existsSync(outputPath)) {
        await fsp.unlink(outputPath);
      }
    } catch (_) {}

    return {
      outputPath: inputPath,
      width,
      height,
      size: origStats.size,
      ext: inputExt,
      mimeType: metadata.format
        ? `image/${metadata.format}`
        : mime.lookup(inputExt) || "application/octet-stream",
      transformed: false,
    };
  }

  // Gather output metadata and size
  const outStats = await fsp.stat(outputPath);
  const outMeta = await sharp(outputPath)
    .metadata()
    .catch(() => ({} as sharp.Metadata));
  const outWidth = (outMeta.width ?? width) as number | null;
  const outHeight = (outMeta.height ?? height) as number | null;

  // If compressed output is larger or equal, keep original and delete compressed
  if (outStats.size >= origStats.size) {
    try {
      await fsp.unlink(outputPath);
    } catch (_) {}
    return {
      outputPath: inputPath,
      width,
      height,
      size: origStats.size,
      ext: inputExt,
      mimeType: metadata.format
        ? `image/${metadata.format}`
        : mime.lookup(inputExt) || "application/octet-stream",
      transformed: false,
    };
  }

  // Success: return compressed info
  return {
    outputPath,
    width: outWidth,
    height: outHeight,
    size: outStats.size,
    ext: finalExt,
    mimeType: `image/${finalExt}`,
    transformed: true,
  };
}

export function normalizeRotations(rotations: number): 1 | 2 | 3 | null {
  if (rotations < 0) return null;
  const cleaned = rotations % 4;
  if (cleaned === 0) return null;
  return cleaned as 1 | 2 | 3;
}

export async function rotateImageFromUrl(
  project_idx: number,
  imageUrl: string,
  rotations: number
) {
  const cleanedRotations = normalizeRotations(rotations);
  if (cleanedRotations === null) {
    console.log("No rotation needed (invalid, negative, or multiple-of-4).");
    return null;
  }

  let { ext, mimeType } = getContentTypeAndExt(imageUrl);
  if (ext === "heif") {
    console.warn("Normalizing .heif → .heic for sharp compatibility.");
    ext = "heic";
  }
  const tmpInput = path.join("/tmp", `input-${Date.now()}.${ext}`);
  const tmpOutput = path.join("/tmp", `output-${Date.now()}.${ext}`);
  const supportedImageExts = [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "tiff",
    "avif",
    "heic",
  ];
  const supportedVectorExts = ["svg"];
  const supportedVideoExts = ["mp4", "mov", "quicktime", "webm"];
  if (supportedVideoExts.includes(ext)) {
    console.log("Video detected — skipping rotation.");
    return null;
  }
  if (supportedVectorExts.includes(ext)) {
    console.log("SVG detected — cannot rotate — skipping.");
    return null;
  }
  if (!supportedImageExts.includes(ext)) {
    console.log("Unsupported file type — skipping.");
    return null;
  }
  const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
  fs.writeFileSync(tmpInput, response.data);
  const normalizedExt = ext === "jpg" ? "jpeg" : ext;
  let outputFormat: keyof sharp.FormatEnum;
  if (ext === "heic") {
    outputFormat = "jpeg";
  } else {
    outputFormat = normalizedExt as keyof sharp.FormatEnum;
  }
  const angle = cleanedRotations * 90;
  await sharp(tmpInput).rotate(angle).toFormat(outputFormat).toFile(tmpOutput);
  const key = extractS3KeyFromUrl(imageUrl);

  const requiredKeys = [
    "AWS_REGION",
    "AWS_S3_MEDIA_BUCKET",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
  ];
  const decryptedKeys = await getDecryptedIntegrationsFunction(
    project_idx,
    requiredKeys,
    []
  );
  if (!decryptedKeys) return null;

  const uploadResult = await uploadFileToS3(
    {
      filePath: tmpOutput,
      key,
      contentType: mimeType,
    },
    decryptedKeys
  );
  return uploadResult.Location;
}
