// src/pemdas/PemdasEditor.tsx
import React from "react";
import { PemdasCanvas } from "./components/PemdasCanvas";

const PemdasEditor = () => {
  return <div className="w-full h-screen">
    <PemdasCanvas />
  </div>;
};

export default PemdasEditor;
