// project/src/util/functions/Forms.tsx

export const targetNextRefOnEnter =
  (nextRef: React.RefObject<HTMLElement | null>) =>
  (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | null>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nextRef.current?.focus();
    }
  };
