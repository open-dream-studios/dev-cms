import Image from "next/image";
import React from "react";
import { IoPlayCircleOutline } from "react-icons/io5";

const RenderedImage = ({ url }: { url: string }) => {
  return (
    <div className="w-[100%] h-[100%]">
      {/\.(mp4|mov)$/i.test(url) ? (
        <>
          <video
            src={url}
            className="object-cover w-full h-full rounded-[10px]"
            playsInline
            muted
            loop
          />
          <div className="absolute top-0 left-0 w-[100%] h-[100%] flex items-center justify-center pb-[4px]">
            <IoPlayCircleOutline size={35} color={"white"} />
          </div>
        </>
      ) : (
        <Image
          src={url}
          alt="image"
          width={200}
          height={200}
          className="object-cover w-full h-full rounded-[10px]"
        />
      )}
    </div>
  );
};

export default RenderedImage;
