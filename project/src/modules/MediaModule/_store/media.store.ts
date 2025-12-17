// project/src/modules/MediaModule/_store/media.store.ts
import { createStore } from "@/store/createStore";

export const useMediaModuleUIStore = createStore({
  renamingFolder: null as string | null,
});
