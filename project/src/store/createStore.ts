// src/store/createStore.ts
import { create } from "zustand";
import type { StoreApi } from "zustand";

type StateUpdater<T> = Partial<T> | ((state: T) => Partial<T>);

// Auto-generate setX(value) for each key in T
type FieldSetters<T extends Record<string, any>> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => void;
};

export function createStore<T extends Record<string, any>>(initialState: T) {
  type Actions = {
    set: (updater: StateUpdater<T>) => void;
    reset: () => void;
    resetKey: <K extends keyof T>(key: K) => void;
  };

  return create<T & Actions & FieldSetters<T>>((set) => {
    const setState: StoreApi<T>["setState"] = set;

    // Build setX functions dynamically
    const fieldSetters = (Object.keys(initialState) as (keyof T)[]).reduce(
      (acc, key) => {
        const setterName = `set${String(key).charAt(0).toUpperCase()}${String(
          key
        ).slice(1)}` as keyof FieldSetters<T>;

        acc[setterName] = ((value: T[typeof key]) =>
          setState({
            [key]: value,
          } as Partial<T>)) as FieldSetters<T>[typeof setterName];

        return acc;
      },
      {} as FieldSetters<T>
    );

    return {
      ...initialState,

      ...fieldSetters,

      set: (updater) =>
        setState((state) =>
          typeof updater === "function" ? updater(state) : updater
        ),

      reset: () => setState(initialState),

      resetKey: (key) =>
        setState((state) => ({
          ...state,
          [key]: initialState[key],
        })),
    };
  });
}
