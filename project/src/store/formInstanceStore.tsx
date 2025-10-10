// src/store/formInstanceStore.ts
import { create } from "zustand";
import { UseFormReturn, FieldValues } from "react-hook-form";

type FormInstanceMap = Record<string, UseFormReturn<any> | null>;

interface FormInstanceStore {
  forms: FormInstanceMap;
  registerForm: (key: string, form: UseFormReturn<any>) => void;
  unregisterForm: (key: string) => void;
  getForm: <T extends FieldValues = any>(
    key: string
  ) => UseFormReturn<T> | null;
  getDirtyForms: (prefix?: string) => { key: string; data: any }[];
  resetForms: (prefix?: string) => void;
}

export const useFormInstanceStore = create<FormInstanceStore>((set, get) => ({
  forms: {},

  registerForm: (key, form) =>
    set((state) => ({
      forms: { ...state.forms, [key]: form },
    })),

  unregisterForm: (key) =>
    set((state) => {
      const { [key]: _, ...rest } = state.forms;
      return { forms: rest };
    }),

  getForm: (key) => get().forms[key] ?? null,
  getDirtyForms: (prefix?: string) => {
    const forms = get().forms;
    return Object.entries(forms)
      .filter(([key, form]) => {
        if (!form) return false;
        const matchesPrefix = prefix ? key.startsWith(prefix) : true;
        return matchesPrefix && form.formState.isDirty;
      })
      .map(([key, form]) => ({ key, data: form!.getValues() }));
  },

  resetForms: (prefix?: string) => {
    const forms = get().forms;
    Object.entries(forms).forEach(([key, form]) => {
      if (!form) return;
      if (prefix && !key.startsWith(prefix)) return;
      form.reset(form.getValues());
    });
  },
}));
