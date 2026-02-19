// project/src/modules/MediaModule/MediaPlayer.tsx
import { useCurrentTheme } from "@/hooks/util/useTheme";
import {
  setCurrentMediaSelected,
  useCurrentDataStore,
} from "@/store/currentDataStore";
import React, { useRef, useState } from "react";

const MediaPlayer = () => {
  const currentTheme = useCurrentTheme();
  const { currentMediaSelected } = useCurrentDataStore();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoTime, setVideoTime] = useState({ current: 0, duration: 0 });
  const [isLoading, setIsLoading] = useState(true);

  if (!currentMediaSelected) return null;
  return (
    <div
      className="select-none fixed z-[990] top-0 left-0 w-[100vw] display-height flex items-center justify-center"
      style={{
        backgroundColor: currentTheme.background_1,
      }}
      onClick={() => setCurrentMediaSelected(null)}
    >
      {currentMediaSelected.type === "video" ? (
        <div className="relative max-w-[100%] max-h-[100%]">
          {/* Spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <video
            ref={videoRef}
            src={currentMediaSelected.url}
            className="object-contain max-w-[100%] max-h-[90vh]"
            playsInline
            loop
            autoPlay
            onClick={() => setCurrentMediaSelected(null)}
            onLoadStart={() => setIsLoading(true)}
            onCanPlay={() => setIsLoading(false)}
            onPlaying={() => setIsLoading(false)}
            onWaiting={() => setIsLoading(true)}
            onStalled={() => setIsLoading(true)}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              setVideoTime({
                current: v.currentTime,
                duration: v.duration,
              });
            }}
          />
          <div
            className="absolute left-0 right-0 bottom-4 px-6"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="range"
              min={0}
              max={videoTime.duration || 0}
              step={0.01}
              value={videoTime.current || 0}
              onChange={(e) => {
                const newTime = parseFloat(e.target.value);
                if (videoRef.current) videoRef.current.currentTime = newTime;
                setVideoTime((prev) => ({ ...prev, current: newTime }));
              }}
              className="w-full appearance-none bg-transparent cursor-pointer"
              style={{
                WebkitAppearance: "none",
                appearance: "none",
              }}
            />
            <style jsx>{`
              input[type="range"] {
                height: 4px;
              }
              input[type="range"]::-webkit-slider-runnable-track {
                height: 4px;
                background: #ccc;
                border-radius: 2px;
              }
              input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                height: 14px;
                width: 14px;
                border-radius: 50%;
                background: #d1d5db;
                margin-top: -5px; /* centers thumb vertically */
                transition: background 0.2s ease;
              }
              input[type="range"]::-webkit-slider-thumb:hover {
                background: #d1d5db;
              }
              input[type="range"]::-moz-range-track {
                height: 4px;
                background: #ccc;
                border-radius: 2px;
              }
              input[type="range"]::-moz-range-thumb {
                height: 14px;
                width: 14px;
                border-radius: 50%;
                background: #d1d5db;
                border: none;
                transition: background 0.2s ease;
              }
              input[type="range"]::-moz-range-thumb:hover {
                background: #d1d5db;
              }
            `}</style>
          </div>
        </div>
      ) : (
        <img
          src={currentMediaSelected.url}
          className="object-cover max-w-[100%] max-h-[100%]"
        />
      )}
    </div>
  );
};

export default MediaPlayer;
