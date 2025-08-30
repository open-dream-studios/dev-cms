import React from "react";

const SiteEditor = ({ src }: { src: string }) => {
  return (
    <div className="relative w-full h-full overflow-y-scroll">
      <iframe
        src={src}
        className="absolute top-0 left-0 w-full h-[100%]"
        style={{
          border: "none",
        }}
      ></iframe>
    </div>
  );
};

export default SiteEditor;