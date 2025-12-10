// server/util/files.ts
import fs from "fs";

export const deleteLocalFile = async (filePath: string) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      // console.log(`🗑️ Deleted local file: ${filePath}`);
    } else {
      // console.log(`⚠️ Tried to delete file but it does not exist: ${filePath}`);
    }
  } catch (err) {
    // console.error(`❌ Error deleting file ${filePath}:`, err);
  }
};
