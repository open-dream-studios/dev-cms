// server/controllers/images.js
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import cloudinary from "../services/cloudinary.js";

// export const compressImages = async (req, res) => {
//   if (!req.files || req.files.length === 0) {
//     return res.status(400).json({ message: "No files uploaded." });
//   }
//   const filePaths = req.files.map((file) => file.path);
//   const uploadedUrls = await compressAndUploadFiles(filePaths);
//   if (uploadedUrls) {
//     return res.status(200).json({ urls: uploadedUrls });
//   } else {
//     return res.status(500).json({ urls: [] });
//   }
// };
export const compressImages = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No files uploaded." });
  }

  const uploadedFiles = await compressAndUploadFiles(req.files.map(f => f.path));

  if (uploadedFiles) {
    return res.status(200).json({ files: uploadedFiles });
    // example: [ { url, metadata: { width, height, extension, size, duration } } ]
  } else {
    return res.status(500).json({ files: [] });
  }
};

// export const compressAndUploadFiles = async (filePaths) => {
//   try {
//     const uploadUrls = [];
//     for (const originalPath of filePaths) {
//       const ext = path.extname(originalPath).toLowerCase();
//       let fileToUpload = originalPath;
//       let resourceType = "image";
//       if (ext === ".webp") {
//         resourceType = "image";
//       } else if ([".jpg", ".jpeg", ".png"].includes(ext)) {
//         const baseName = path.basename(originalPath, ext);
//         const compressedPath = path.join(
//           path.dirname(originalPath),
//           `${baseName}-compressed.webp`
//         );
//         await sharp(originalPath)
//           .resize({ width: 1200, withoutEnlargement: true })
//           .webp({ quality: 90 })
//           .toFile(compressedPath);

//         await fs.unlink(originalPath);
//         fileToUpload = compressedPath;
//       } else if ([".mp4", ".mov", ".avi", ".mkv"].includes(ext)) {
//         resourceType = "video";
//       } else {
//         console.warn(`Skipping unsupported file type: ${originalPath}`);
//         continue;
//       }

//       function uploadLargeAsync(filePath, options) {
//         return new Promise((resolve, reject) => {
//           cloudinary.uploader.upload_large(
//             filePath,
//             options,
//             (error, result) => {
//               if (error) reject(error);
//               else resolve(result);
//             }
//           );
//         });
//       }

//       const folderBase = "open_dream/dev-cms/projects";
//       if (resourceType === "video") {
//         const result = await uploadLargeAsync(fileToUpload, {
//           folder: `${folderBase}/videos`,
//           resource_type: "video",
//           chunk_size: 6000000,
//         });
//         uploadUrls.push(result.secure_url);
//       } else {
//         const result = await cloudinary.uploader.upload(fileToUpload, {
//           folder: `${folderBase}/images`,
//           resource_type: resourceType,
//         });
//         uploadUrls.push(result.secure_url);
//       }
//       if (fileToUpload !== originalPath) {
//         await fs.unlink(fileToUpload);
//       }
//     }
//     return uploadUrls;
//   } catch (error) {
//     console.error("File upload error:", error);
//     return false;
//   }
// };

export const compressAndUploadFiles = async (filePaths) => {
  try {
    const uploads = [];

    for (const originalPath of filePaths) {
      const ext = path.extname(originalPath).toLowerCase().replace(".", "");
      let fileToUpload = originalPath;
      let resourceType = "image";
      let width = null;
      let height = null;
      let duration = null;
      let size = null;

      // --- IMAGE handling ---
      if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
        // read metadata with sharp
        const imageMeta = await sharp(originalPath).metadata();
        width = imageMeta.width;
        height = imageMeta.height;
        size = imageMeta.size;

        // compress to webp if not already
        if (ext !== "webp") {
          const baseName = path.basename(originalPath, path.extname(originalPath));
          const compressedPath = path.join(
            path.dirname(originalPath),
            `${baseName}-compressed.webp`
          );
          await sharp(originalPath)
            .resize({ width: 1200, withoutEnlargement: true })
            .webp({ quality: 90 })
            .toFile(compressedPath);

          await fs.unlink(originalPath);
          fileToUpload = compressedPath;
        }
      }

      // --- VIDEO handling ---
      else if (["mp4", "mov", "avi", "mkv"].includes(ext)) {
        resourceType = "video";
        // Cloudinary will return width/height/duration in upload result
      } else {
        console.warn(`Skipping unsupported file type: ${originalPath}`);
        continue;
      }

      function uploadLargeAsync(filePath, options) {
        return new Promise((resolve, reject) => {
          cloudinary.uploader.upload_large(
            filePath,
            options,
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
        });
      }

      const folderBase = "open_dream/dev-cms/projects";
      let result;

      if (resourceType === "video") {
        result = await uploadLargeAsync(fileToUpload, {
          folder: `${folderBase}/videos`,
          resource_type: "video",
          chunk_size: 6000000,
        });
      } else {
        result = await cloudinary.uploader.upload(fileToUpload, {
          folder: `${folderBase}/images`,
          resource_type: "image",
        });
      }

      // Cloudinary result includes size, width, height, duration etc.
      const meta = {
        width: result.width || width,
        height: result.height || height,
        extension: ext,
        size: result.bytes || size,
        duration: result.duration || null,
      };

      uploads.push({
        url: result.secure_url,
        metadata: meta,
      });

      if (fileToUpload !== originalPath) {
        await fs.unlink(fileToUpload);
      }
    }

    return uploads;
  } catch (error) {
    console.error("File upload error:", error);
    return false;
  }
};