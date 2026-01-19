// src/store/util/formInstanceStore.ts
import { create } from "zustand";
import { UseFormReturn, FieldValues } from "react-hook-form";

type StoredForm = {
  form: UseFormReturn<any>;
  submit?: () => Promise<void>;
};

type FormInstanceMap = Record<string, StoredForm>;

interface FormInstanceStore {
  forms: FormInstanceMap;
  registerForm: (
    key: string,
    form: UseFormReturn<any>,
    submit?: () => Promise<void>
  ) => void;
  unregisterForm: (key: string) => void;
  getForm: <T extends FieldValues = any>(
    key: string
  ) => UseFormReturn<T> | null;
  getDirtyForms: (prefix?: string) => { key: string; stored: StoredForm }[];
  flushDirtyForms: (prefix?: string) => Promise<void>;
  resetForms: (prefix?: string) => void;
}

export const useFormInstanceStore = create<FormInstanceStore>((set, get) => ({
  forms: {},

  registerForm: (key, form, submit) =>
    set((state) => ({
      forms: {
        ...state.forms,
        [key]: { form, submit },
      },
    })),

  unregisterForm: (key) =>
    set((state) => {
      const { [key]: _, ...rest } = state.forms;
      return { forms: rest };
    }),

  getForm: (key) => get().forms[key]?.form ?? null,

  getDirtyForms: (prefix) =>
    Object.entries(get().forms)
      .filter(([key, stored]) => {
        if (prefix && !key.startsWith(prefix)) return false;
        const dirty =
          Object.keys(stored.form.formState.dirtyFields ?? {}).length > 0;
        return dirty;
      })
      .map(([key, stored]) => ({ key, stored })),

  flushDirtyForms: async (prefix) => {
    const dirty = get().getDirtyForms(prefix);
    for (const { stored } of dirty) {
      if (stored.submit) {
        await stored.submit();
      } else {
        await stored.form.handleSubmit(() => {})();
      }
    }
  },

  resetForms: (prefix) => {
    Object.entries(get().forms).forEach(([key, stored]) => {
      if (prefix && !key.startsWith(prefix)) return;
      stored.form.reset(stored.form.getValues());
    });
  },
}));