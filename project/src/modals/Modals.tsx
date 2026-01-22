// project/src/modals/Modals.tsx
"use client";
import React, { useContext, useEffect, useRef } from "react";
import { AuthContext } from "../contexts/authContext";
import { IoCloseOutline } from "react-icons/io5";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { useUiStore } from "@/store/useUIStore";

const Modals = ({ landing }: { landing: boolean }) => {
  const { currentUser } = useContext(AuthContext);
  const { modal1, setModal1, modal2, setModal2 } = useUiStore();
  const currentTheme = useCurrentTheme();

  const modal1Ref = useRef<HTMLDivElement>(null);
  const modal2Ref = useRef<HTMLDivElement>(null);

  const mouseDownInside = useRef(false);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (modal2Ref.current) {
        const modalContent = modal2Ref.current.querySelector("div");
        mouseDownInside.current = !!(
          modalContent && modalContent.contains(e.target as Node)
        );
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  if (!landing && !currentUser) return;

  return (
    <div data-modal>
      <div
        ref={modal1Ref}
        onClick={() => {
          if (modal1.offClickClose) {
            setModal1({ ...modal1, open: false });
          }
        }}
        className={`z-[940] fixed top-0 left-0 w-[100vw] display-height 
          flex items-center justify-center
          transition-all duration-580 ease-in-out
          ${
            modal1.open
              ? "opacity-100 bg-black/50 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }
        `}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`relative overflow-hidden ${modal1.width} ${modal1.maxWidth} ${modal1.aspectRatio} ${modal1.borderRadius}`}
          style={{
            border: `1px solid ${currentTheme.background_2_2}`,
            color: currentTheme.text_1,
            backgroundColor: currentTheme.background_1,
          }}
        >
          {modal1.showClose && (
            <div
              className="dim hover:brightness-90 cursor-pointer absolute right-[13px] top-[10px] w-[36px] h-[36px] rounded-full flex items-center justify-center"
              onClick={() => setModal1({ ...modal1, open: false })}
              style={{
                backgroundColor: currentTheme.background_2_2,
              }}
            >
              <IoCloseOutline color={currentTheme.text_3} size={25} />
            </div>
          )}
          {modal1.content}
        </div>
      </div>

      <div
        ref={modal2Ref}
        onClick={() => {
          if (modal2.offClickClose) {
            setModal2({ ...modal2, open: false });
          }
        }}
        className={`z-[940] fixed top-0 left-0 w-[100vw] display-height 
          flex items-center justify-center
          transition-all duration-500 ease-in-out
          ${
            modal2.open
              ? "opacity-100 bg-black/50 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }
        `}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`relative overflow-hidden ${modal2.width} ${modal2.maxWidth} ${modal2.aspectRatio} ${modal2.borderRadius}`}
          style={{
            border: `1px solid ${currentTheme.background_2_2}`,
            color: currentTheme.text_1,
            backgroundColor: currentTheme.background_1_2,
          }}
        >
          {modal2.showClose && (
            <div
              className="dim hover:brightness-90 cursor-pointer absolute right-[13px] top-[10px] w-[36px] h-[36px] rounded-full flex items-center justify-center"
              onClick={() => setModal2({ ...modal2, open: false })}
              style={{
                backgroundColor: currentTheme.background_2_2,
              }}
            >
              <IoCloseOutline color={currentTheme.text_3} size={25} />
            </div>
          )}
          {modal2.content}
        </div>
      </div>
    </div>
  );
};

export default Modals;
