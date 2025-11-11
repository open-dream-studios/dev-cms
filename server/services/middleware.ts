// server/services/middleware.ts
import multer from "multer";
import os from "os";

const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (_: any, file: any, cb: any) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1 GB limit
  },
});

export default upload;
