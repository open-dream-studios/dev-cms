// project/src/util/functions/Images.tsx
export const preloadImages = (urls: string[]) => {
  urls.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
};