// project/src/modules/EstimationModule/EstimationPEMDAS/_store/pemdas.store.ts
import { createStore } from "@/store/createStore";
import { initialState } from "../state/reducer";

type PemdasGraphState = typeof initialState;

export const usePemdasUIStore = createStore({
  graphState: initialState as PemdasGraphState,
  openNodeIdTypeSelection: null as null | string,
  operandOverlayOpen: false, 
});
