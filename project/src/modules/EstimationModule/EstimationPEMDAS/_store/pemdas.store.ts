// project/src/modules/EstimationModule/EstimationPEMDAS/_store/pemdas.store.ts
import { createStore } from "@/store/createStore";
import { initialState } from "../state/reducer";

type PemdasGraphState = typeof initialState;

export const usePemdasUIStore = createStore({
  graphs: {
    estimation: initialState as PemdasGraphState,
    variables: {} as Record<string, PemdasGraphState>,
  },
  openNodeIdTypeSelection: null as null | string,
  operandOverlayNodeId: null as string | null,
  dragIsOverCanvas: false,
});