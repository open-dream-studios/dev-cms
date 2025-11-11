// server/services/aws/S3.js
import {
  S3Client,
  S3ClientConfig,
  PutObjectCommandInput,
  ObjectCannedACL,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs";

const {
  AWS_REGION,
  AWS_S3_MEDIA_BUCKET,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  S3_PUBLIC = "true", // if "true" we put ACL: public-read (you can remove if you prefer bucket policy)
} = process.env;

if (!AWS_S3_MEDIA_BUCKET || !AWS_REGION) {
  throw new Error("Missing S3 config in env (AWS_S3_BUCKET, AWS_REGION)");
}

const s3Config: S3ClientConfig = {
  region: AWS_REGION!,
  ...(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: AWS_ACCESS_KEY_ID,
          secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
};
export const s3Client = new S3Client(s3Config);

interface UploadFileOptions {
  filePath: string;
  key: string;
  contentType?: string;
}

/**
 * Uploads a file to S3 using multipart streaming (lib-storage).
 * @param {object} options
 * @param {string} options.filePath Local filesystem path
 * @param {string} options.key Desired S3 key (path/filename in bucket)
 * @param {string} options.contentType MIME type
 * @returns {Promise<{Bucket:string, Key:string, Location:string, ETag?:string, ContentLength:number}>}
 */
export async function uploadFileToS3({
  filePath,
  key,
  contentType,
}: UploadFileOptions): Promise<{
  Bucket: string;
  Key: string;
  Location: string | null;
  ETag?: string;
  ContentLength: number;
}> {
  const fileStream = fs.createReadStream(filePath);
  const fileSize = (await fs.promises.stat(filePath)).size;

  const uploadParams: PutObjectCommandInput = {
    Bucket: AWS_S3_MEDIA_BUCKET as string,
    Key: key,
    Body: fileStream,
    ContentType: contentType,
  };

  const uploader = new Upload({
    client: s3Client,
    params: uploadParams,
    queueSize: 4, // concurrency
    partSize: 5 * 1024 * 1024, // 5 MB parts
    leavePartsOnError: false,
  });

  const result = await uploader.done();

  // Construct public URL (simple form). If you use a custom domain or CloudFront, change this.
  const location =
    S3_PUBLIC === "true"
      ? `https://${AWS_S3_MEDIA_BUCKET}.s3.${
          process.env.AWS_REGION
        }.amazonaws.com/${encodeURIComponent(key)}`
      : null;

  return {
    Bucket: AWS_S3_MEDIA_BUCKET!,
    Key: key,
    Location: location,
    ETag: result.ETag,
    ContentLength: fileSize,
  };
}
