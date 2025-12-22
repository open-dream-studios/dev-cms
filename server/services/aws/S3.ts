// server/services/aws/S3.ts
import {
  S3Client,
  S3ClientConfig,
  PutObjectCommandInput,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";
import { ModuleDecryptedKeys } from "@open-dream/shared";
import fs from "fs";
import { randomUUID } from "crypto";

interface UploadFileOptions {
  filePath: string;
  key: string;
  contentType?: string;
  tags?: Record<string, string>;
}

export async function getSignedS3Url(
  key: string,
  bucket: string,
  region: string,
  accessKey: string,
  secretKey: string
) {
  const client = new S3Client({
    region,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return await getSignedUrl(client, command, { expiresIn: 3600 });
}

export function extractS3KeyFromUrl(url: string) {
  const u = new URL(url);
  return decodeURIComponent(u.pathname.slice(1));
}

function serializeS3Tags(tags?: Record<string, string>) {
  if (!tags || Object.keys(tags).length === 0) return undefined;
  return Object.entries(tags)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

export function buildS3Key({
  projectId,
  ext,
  type,
}: {
  projectId: string;
  ext: string;
  type: "media" | "recordings";
}) {
  // const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const useDevDB =
    process.env.USE_DEV_DB === "true" && process.env.NODE_ENV !== "production";
  const safeProject = String(projectId || "global").replace(/[^\w-]/g, "_");
  const id = randomUUID();
  const key = `${
    useDevDB ? "dev" : "prod"
  }/${safeProject}/${type}/${id}.${ext}`;
  return key;
}

export async function uploadFileToS3(
  { filePath, key, contentType, tags }: UploadFileOptions,
  clientAccount: ModuleDecryptedKeys | null
): Promise<{
  Bucket: string;
  Key: string;
  Location: string | null;
  ETag?: string;
  ContentLength: number;
}> {
  let AWS_REGION = null;
  let AWS_S3_MEDIA_BUCKET = null;
  let AWS_ACCESS_KEY_ID = null;
  let AWS_SECRET_ACCESS_KEY = null;

  if (!clientAccount) {
    AWS_REGION = process.env.AWS_REGION;
    AWS_S3_MEDIA_BUCKET = process.env.AWS_S3_MEDIA_BUCKET;
    AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
    AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
  } else {
    AWS_REGION = clientAccount.AWS_REGION;
    AWS_S3_MEDIA_BUCKET = clientAccount.AWS_S3_MEDIA_BUCKET;
    AWS_ACCESS_KEY_ID = clientAccount.AWS_ACCESS_KEY_ID;
    AWS_SECRET_ACCESS_KEY = clientAccount.AWS_SECRET_ACCESS_KEY;
  }

  if (
    !AWS_S3_MEDIA_BUCKET ||
    !AWS_REGION ||
    !AWS_ACCESS_KEY_ID ||
    !AWS_SECRET_ACCESS_KEY
  ) {
    throw new Error("Missing S3 config");
  }

  AWS_ACCESS_KEY_ID = AWS_ACCESS_KEY_ID?.trim();
  AWS_SECRET_ACCESS_KEY = AWS_SECRET_ACCESS_KEY?.trim();
  AWS_REGION = AWS_REGION?.trim();
  AWS_S3_MEDIA_BUCKET = AWS_S3_MEDIA_BUCKET?.trim();

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
  const s3Client = new S3Client(s3Config);
  const fileStream = fs.createReadStream(filePath);
  const fileSize = (await fs.promises.stat(filePath)).size;

  const uploadParams: PutObjectCommandInput = {
    Bucket: AWS_S3_MEDIA_BUCKET as string,
    Key: key,
    Body: fileStream,
    ContentType: contentType,
    Tagging: serializeS3Tags(tags),
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
  // const location = `https://${AWS_S3_MEDIA_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${encodeURIComponent(
  //   key
  // )}`;
  const location = `https://${AWS_S3_MEDIA_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;

  return {
    Bucket: AWS_S3_MEDIA_BUCKET!,
    Key: key,
    Location: location,
    ETag: result.ETag,
    ContentLength: fileSize,
  };
}
