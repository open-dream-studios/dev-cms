import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import fs from "fs";
import { getS3Client } from "../services/aws/S3.js";

export async function uploadToS3(localFile: string) {
  const s3Client = await getS3Client(null)
  if (!s3Client) return null

  const bucket = process.env.AWS_S3_BUCKET;
  const name = path.basename(localFile);
  const base = name.replace(/(\.sql\.gz|\.sql\.gz\.sha256|\.sha256)$/, "");

  const key = `${base}/${name}`;
  const stream = fs.createReadStream(localFile);
  const weekly = new Date().getDay() === 0;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: stream,
      Tagging: `type=${weekly ? "weekly" : "daily"}`, 
    })
  );
  console.log(`☁️ Uploaded to S3: s3://${bucket}/${key}`);
}
