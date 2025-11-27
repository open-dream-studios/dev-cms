// src/modules/GoogleModule/_store/resetGoogleStores.ts
import { useGoogleUIStore } from "./useGoogleUIStore";
import { useGoogleCurrentDataStore } from "./useGoogleCurrentDataStore";

export function resetGoogleStores() {
  useGoogleUIStore.getState().resetGoogleUIStore();
  useGoogleCurrentDataStore.getState().resetGoogleDataStore();
}
