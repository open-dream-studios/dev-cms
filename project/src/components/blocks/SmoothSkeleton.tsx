// project/src/components/blocks/SmoothSkeleton.tsx
import React from "react";
import { motion } from "framer-motion";

const SmoothSkeleton = () => {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl bg-neutral-800/40 dark:bg-neutral-200/20">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

export default SmoothSkeleton;
