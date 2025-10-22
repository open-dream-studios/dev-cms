// project/src/hooks/useModules.tsx
"use client";
import Modal2Continue from "@/modals/Modal2Continue";
import { useModal2Store } from "@/store/useModalStore";

export function useModules() {
  const modal2 = useModal2Store((state: any) => state.modal2);
  const setModal2 = useModal2Store((state: any) => state.setModal2);

  const promptContinue = async (
    text: string,
    threeOptions: boolean,
    onNoSave: () => void,
    onContinue: () => void
  ) => {
    setModal2({
      ...modal2,
      open: !modal2.open,
      showClose: false,
      offClickClose: true,
      width: "w-[300px]",
      maxWidth: "max-w-[400px]",
      aspectRatio: "aspect-[5/2]",
      borderRadius: "rounded-[12px] md:rounded-[15px]",
      content: (
        <Modal2Continue
          text={text}
          onContinue={onContinue}
          threeOptions={threeOptions}
          onNoSave={onNoSave}
        />
      ),
    });
  };

  return {
    promptContinue,
  };
}
