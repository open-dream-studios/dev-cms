import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import fs from "fs";

export async function uploadToS3(localFile: string) {
  const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const bucket = process.env.AWS_S3_BUCKET;
  const name = path.basename(localFile);
  const base = name.replace(/(\.sql\.gz|\.sql\.gz\.sha256|\.sha256)$/, "");

  const key = `${base}/${name}`;
  const stream = fs.createReadStream(localFile);
  const weekly = new Date().getDay() === 0;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: stream,
      Tagging: `type=${weekly ? "weekly" : "daily"}`, 
    })
  );
  console.log(`☁️ Uploaded to S3: s3://${bucket}/${key}`);
}
