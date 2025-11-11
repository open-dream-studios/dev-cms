// server/functions/media.ts
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import mime from "mime-types";
import { randomUUID } from "crypto";

export function getContentTypeAndExt(filename: string) {
  let ext = path
    .extname(filename || "")
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
 * Build S3 key. Using project_id included in path gives easy filtering.
 * We use uuid to avoid collisions. Keep extension to reflect final file type.
 * Example: media/PROJECT_123/2025-11-06/uuid.webp
 */
export function buildS3Key({
  projectId,
  ext,
  folderPrefix = "public-media",
}: {
  projectId: string;
  ext: string;
  folderPrefix?: string;
}) {
  // const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const useDevDB =
    process.env.USE_DEV_DB === "true" && process.env.NODE_ENV !== "production";
  const safeProject = String(projectId || "global").replace(/[^\w-]/g, "_");
  const id = randomUUID();
  const key = `${folderPrefix}/${
    useDevDB ? "dev" : "prod"
  }/${safeProject}/${id}.${ext}`;
  return key;
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

  const origStats = await fs.stat(inputPath).catch(() => null);
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
        await fs.unlink(outputPath);
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
  const outStats = await fs.stat(outputPath);
  const outMeta = await sharp(outputPath)
    .metadata()
    .catch(() => ({} as sharp.Metadata));
  const outWidth = (outMeta.width ?? width) as number | null;
  const outHeight = (outMeta.height ?? height) as number | null;

  // If compressed output is larger or equal, keep original and delete compressed
  if (outStats.size >= origStats.size) {
    try {
      await fs.unlink(outputPath);
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
