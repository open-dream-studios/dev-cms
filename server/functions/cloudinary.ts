// server/functions/cloudinary.js
import cloudinary from "../services/cloudinary.js";

export async function deleteFromCloudinary(mediaItems: any) {
  const grouped = mediaItems.reduce(
    (acc: any, m: any) => {
      const type = m.type === "video" ? "video" : "image";
      acc[type].push(m.public_id);
      return acc;
    },
    { image: [], video: [] }
  );

  if (grouped.image.length > 0) {
    await cloudinary.api.delete_resources(grouped.image, { resource_type: "image" });
  }
  if (grouped.video.length > 0) {
    await cloudinary.api.delete_resources(grouped.video, { resource_type: "video" });
  }
}