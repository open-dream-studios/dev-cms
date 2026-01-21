// src/pemdas/components/OperandOverlayPortal.tsx
import { createPortal } from "react-dom";

export const OperandOverlayPortal = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const root = document.getElementById("operand-overlay-root");
  if (!root) return null;
  return createPortal(children, root);
};