import fs from "fs";
import path from "path";
import { google } from "googleapis";
import dotenv from "dotenv";
import unzipper from "unzipper";
import heicConvert from "heic-convert";

dotenv.config({
  path: path.resolve(process.cwd(), "../..", ".env"),
});

async function downloadFile(drive, fileId, fileName) {
  const destPath = path.join("downloads", fileName);
  const dest = fs.createWriteStream(destPath);

  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );

  return new Promise((resolve, reject) => {
    res.data
      .on("end", () => {
        console.log(`✅ Downloaded ${fileName}`);
        resolve(destPath); // Return the full path of the downloaded file
      })
      .on("error", reject)
      .pipe(dest);
  });
}

async function unzipFileFlatten(zipPath, extractTo) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(zipPath)
      .pipe(unzipper.Parse()) // Parse entries manually
      .on("entry", async (entry) => {
        const fileName = path.basename(entry.path);
        const destPath = path.join(extractTo, fileName);

        if (entry.type === "File") {
          const writeStream = fs.createWriteStream(destPath);
          entry.pipe(writeStream);

          writeStream.on("finish", async () => {
            if (fileName.toLowerCase().endsWith(".heic")) {
              await convertHeicToJpeg(destPath);
            }
          });
        } else {
          entry.autodrain();
        }
      })
      .on("close", () => {
        console.log(`📂 Extracted and flattened: ${zipPath}`);
        fs.unlinkSync(zipPath); // delete zip after extraction
        console.log(`🗑️ Deleted zip: ${zipPath}`);
        resolve();
      })
      .on("error", reject);
  });
}

function isMediaFile(mimeType) {
  const mediaMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/heic",
    "image/heif",
    "image/webp",
    "video/mp4",
    "video/quicktime",  
  ];
  return mediaMimeTypes.includes(mimeType);
}

function extensionFromMime(mimeType) {
  const map = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/heic": ".heic",
    "image/heif": ".heif",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/quicktime": ".mov",
  };
  return map[mimeType] || "";
}

async function convertHeicToJpeg(inputPath) {
  const outputPath = path.join(
    path.dirname(inputPath),
    path.basename(inputPath, path.extname(inputPath)) + ".jpg"
  );

  const inputBuffer = fs.readFileSync(inputPath);
  const outputBuffer = await heicConvert({
    buffer: inputBuffer,
    format: "JPEG",
    quality: 1,
  });

  fs.writeFileSync(outputPath, outputBuffer);
  fs.unlinkSync(inputPath);
  console.log(`🔄 Converted file → JPEG: ${outputPath}`);

  return outputPath;
}

async function downloadFolder(auth, folderId) {
  const drive = google.drive({ version: "v3", auth });
  const res = await drive.files.list({
    q: `'${folderId}' in parents`,
    fields: "files(id, name, mimeType)",
  });

  if (!fs.existsSync("downloads")) {
    fs.mkdirSync("downloads");
  }

  const files = res.data.files || [];

  // ZIP first
  const zipFile = files.find((f) => f.name.toLowerCase().endsWith(".zip"));
  if (zipFile) {
    console.log(`📦 Found zip file: ${zipFile.name}`);
    const zipPath = await downloadFile(drive, zipFile.id, zipFile.name);
    await unzipFileFlatten(zipPath, "downloads");
    return;
  }

  // Media files
  const mediaFiles = files.filter((f) => isMediaFile(f.mimeType));
  if (mediaFiles.length > 0) {
    console.log(`🎥 Found ${mediaFiles.length} media files. Downloading...`);
    for (const file of mediaFiles) {
      const ext = extensionFromMime(file.mimeType);
      const fileNameWithExt = file.name.endsWith(ext)
        ? file.name
        : file.name + ext;
      const safeName = `${file.id.slice(0, 6)}_${fileNameWithExt}`;
      const downloadedPath = await downloadFile(drive, file.id, safeName);
      if (file.mimeType === "image/heic" || file.mimeType === "image/heif") {
        await convertHeicToJpeg(downloadedPath);
      }
    }
  } else {
    console.log("⚠️ No zip or media files found.");
  }
}

export const downloadCommand = async (folderId) => {
  const auth = await AuthoirizeOAuth2Client();
  await downloadFolder(auth, folderId);
};
