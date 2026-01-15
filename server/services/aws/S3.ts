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
import { getDecryptedIntegrationsFunction } from "../../handlers/integrations/integrations_repositories.js";

interface UploadFileOptions {
  filePath: string;
  key: string;
  contentType?: string;
  tags?: Record<string, string>;
}

export const getS3Client = async (project_idx: number | null) => {
  let decryptedKeys;
  if (!project_idx) {
    // Open Dream AWS access
    decryptedKeys = {
      AWS_REGION: process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    };
  } else {
    // Project AWS access
    decryptedKeys = await getDecryptedIntegrationsFunction(
      project_idx,
      [
        "AWS_REGION",
        "AWS_S3_MEDIA_BUCKET",
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
      ],
      []
    );
  }

  if (!decryptedKeys) return null;
  const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } =
    decryptedKeys;
  if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) return null;

  return new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });
};

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

export const getDecryptedAWSKeys = async (project_idx: number) => {
  const decryptedKeys = await getDecryptedIntegrationsFunction(
    project_idx,
    [
      "AWS_REGION",
      "AWS_S3_MEDIA_BUCKET",
      "AWS_ACCESS_KEY_ID",
      "AWS_SECRET_ACCESS_KEY",
    ],
    []
  );
  if (!decryptedKeys) return null;
  const {
    AWS_REGION,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_S3_MEDIA_BUCKET,
  } = decryptedKeys;
  if (
    !AWS_REGION ||
    !AWS_ACCESS_KEY_ID ||
    !AWS_SECRET_ACCESS_KEY ||
    !AWS_S3_MEDIA_BUCKET
  ) {
    return null;
  } else {
    return decryptedKeys;
  }
};

export async function uploadFileToS3(
  { filePath, key, contentType, tags }: UploadFileOptions,
  project_idx: number | null
): Promise<{
  Bucket: string;
  Key: string;
  Location: string | null;
  ETag?: string;
  ContentLength: number;
} | null> {
  let decryptedKeys;
  if (project_idx) {
    decryptedKeys = await getDecryptedAWSKeys(project_idx);
  } else {
    decryptedKeys = {
      AWS_S3_MEDIA_BUCKET: process.env.AWS_S3_MEDIA_BUCKET,
      AWS_REGION: process.env.AWS_REGION,
    };
  } 
  if (!decryptedKeys) return null;

  const { AWS_S3_MEDIA_BUCKET, AWS_REGION } = decryptedKeys;
  if (!AWS_S3_MEDIA_BUCKET || !AWS_REGION) return null;

  const s3Client = await getS3Client(project_idx);
  if (!s3Client) return null;

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
