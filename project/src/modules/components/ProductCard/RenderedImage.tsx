import { Media } from "@open-dream/shared";
import Image from "next/image";
import React from "react";
import { IoPlayCircleOutline } from "react-icons/io5";

const RenderedImage = ({
  media,
  rounded,
}: {
  media: Media;
  rounded: boolean;
}) => {
  return (
    <div className="w-[100%] aspect-[1/1]">
      {media.type === "image" ? (
        <img
          key={media.version}
          style={{ willChange: "transform" }}
          draggable={false}
          // src={`${media.url}${media.url.includes("?") ? "&" : "?"}v=${media.version ?? 0}`}
          src={media.url}
          alt={media.alt_text || ""}
          className="dim hover:brightness-90 object-cover w-full aspect-[1/1]"
        />
      ) : (
        <>
          <video
            key={media.version}
            src={media.url}
            className={`object-cover w-full h-full ${rounded && "rounded-[10px]"}`}
            playsInline
            muted
            loop
          />
          <div className="absolute top-0 left-0 w-[100%] h-[100%] flex items-center justify-center pb-[4px]">
            <IoPlayCircleOutline size={35} color={"white"} />
          </div>
        </>
      )}
    </div>
  );
};

export default RenderedImage;
