// EnumFactEditor.tsx
import {
  EstimationFactDefinition,
  FactType,
  EstimationFactEnumOption,
} from "@open-dream/shared";
import { useEstimationFactDefinitions } from "@/contexts/queryContext/queries/estimations/estimationFactDefinitions";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { useContext, useMemo, useState } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { cleanVariableKey } from "@/util/functions/Variables";
import { toast } from "react-toastify";

export default function EnumFactEditor({
  fact,
  onClose,
}: {
  fact: EstimationFactDefinition;
  onClose: () => void;
}) {
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId, currentProcessId } = useCurrentDataStore();
  const theme = useCurrentTheme();

  const { upsertFactDefinition, upsertEnumOption, deleteEnumOption } =
    useEstimationFactDefinitions(
      !!currentUser,
      currentProjectId,
      currentProcessId,
    );

  const [draftType, setDraftType] = useState<FactType>(fact.fact_type);
  const [draftOptions, setDraftOptions] = useState<EstimationFactEnumOption[]>(
    fact.enum_options ?? [],
  );

  const isDirty = useMemo(() => {
    return (
      draftType !== fact.fact_type ||
      JSON.stringify(draftOptions) !== JSON.stringify(fact.enum_options ?? [])
    );
  }, [draftType, draftOptions, fact]);

  // ---------- TYPE ----------
  const changeType = (next: FactType) => {
    setDraftType(next);
    if (draftType === "enum" && next !== "enum") {
      setDraftOptions([]);
    }
    if (draftType !== "enum" && next === "enum") {
      setDraftOptions(originalOptions);
    }
  };
  
  // ---------- OPTIONS ----------
  const addOption = () => {
    setDraftOptions((prev) => [
      ...prev,
      {
        id: -Date.now(),
        option_id: `__draft__${Date.now()}`,
        fact_definition_idx: fact.id,
        label: "",
        value: "",
        ordinal: prev.length,
        is_archived: false,
        created_at: "",
        updated_at: "",
      },
    ]);
  };

  const updateDraftOption = (option_id: string, value: string) => {
    setDraftOptions((prev) =>
      prev.map((o) => (o.option_id === option_id ? { ...o, value } : o)),
    );
  };

  const removeOption = (option_id: string) => {
    setDraftOptions((prev) => prev.filter((o) => o.option_id !== option_id));
  };

  const [originalOptions] = useState<EstimationFactEnumOption[]>(
    fact.enum_options ?? [],
  );

  // ---------- SAVE / CANCEL ----------
  const save = async () => {
    try {
      // 1. type change
      if (draftType !== fact.fact_type) {
        if (fact.fact_type === "enum" && draftType !== "enum") {
          for (const opt of fact.enum_options ?? []) {
            await deleteEnumOption(opt.option_id);
          }
        }

        await upsertFactDefinition({
          fact_id: fact.fact_id,
          fact_key: fact.fact_key,
          fact_type: draftType,
          variable_scope: fact.variable_scope,
          process_id: fact.process_id,
          folder_id: fact.folder_id,
          description: fact.description,
        });
      }

      if (draftType !== "enum") {
        onClose();
        return;
      }

      // 2. delete removed
      const removed = originalOptions.filter(
        (o) => !draftOptions.some((d) => d.option_id === o.option_id),
      );

      for (const opt of removed) {
        await deleteEnumOption(opt.option_id);
      }

      const dirtyOptions = draftOptions.filter((opt) => {
        const original = originalOptions.find(
          (o) => o.option_id === opt.option_id,
        );
        if (!original) return true;
        return original.value !== opt.value;
      });

      // 3. upsert
      for (const opt of dirtyOptions) {
        if (!opt.value.trim()) continue;

        const res = await upsertEnumOption({
          fact_definition_idx: fact.id,
          option: {
            option_id: opt.option_id.startsWith("__draft__")
              ? undefined
              : opt.option_id,
            label: opt.value,
            value: opt.value,
          },
        });
        if (res.success === false) {
          toast.warning(res.message);
        }
      }
      onClose();
    } catch (err: any) {
      toast.warning("Save failed");
    }
  };

  const cancel = () => {
    onClose();
  };

  return (
    <div
      className="absolute inset-0 z-500 flex justify-start items-start pt-[60px] pl-[8px] overflow-y-auto pointer-events-none"
      style={{ backgroundColor: "transparent" }}
    >
      <div
        className="pointer-events-auto w-[340px] rounded-[14px] px-5 pb-5 pt-3 flex flex-col gap-2 shadow-lg"
        style={{ backgroundColor: theme.background_2_dim }}
      >
        {/* HEADER */}
        <div className="flex justify-between">
          <div>
            <h2 className="text-[18px] font-semibold">
              {cleanVariableKey(fact.fact_key)}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-lg cursor-pointer brightness-88 hover:brightness-70 dim mt-[-2px]"
          >
            ✕
          </button>
        </div>

        {/* TYPE */}
        <div className="flex items-center gap-3 justify-between">
          <div className="flex flex-row gap-3 items-center">
            <span className="text-sm opacity-70">Type</span>
            <div
              className="rounded-md px-2 pt-[1px] pb-[4px] mt-[1px] min-w-[114px]"
              style={{ backgroundColor: theme.background_1 }}
            >
              <select
                value={draftType}
                onChange={(e) => changeType(e.target.value as FactType)}
                className="w-[100%] text-sm outline-none bg-transparent cursor-pointer hover:brightness-80 dim"
              >
                <option value="number">Number</option>
                <option value="string">Text</option>
                <option value="boolean">True / False</option>
                <option value="enum">Selection</option>
              </select>
            </div>
          </div>

          {fact.fact_type === "enum" && draftType === "enum" && (
            <button
              onClick={addOption}
              className="text-sm opacity-60 hover:brightness-80 dim cursor-pointer"
            >
              + Add option
            </button>
          )}
        </div>

        {/* ENUM OPTIONS */}
        {draftType === "enum" && (
          <div className="flex flex-col gap-[6px] mt-[4px]">
            {draftOptions.length === 0 && (
              <p className="text-sm opacity-50">No options yet</p>
            )}

            {draftOptions.map((opt) => (
              <div
                key={opt.option_id}
                className="flex gap-2 items-center rounded-md px-3 py-2"
                style={{ backgroundColor: theme.background_1 }}
              >
                <input
                  value={opt.value}
                  onChange={(e) =>
                    updateDraftOption(opt.option_id, e.target.value)
                  }
                  className="flex-1 bg-transparent outline-none text-sm"
                  placeholder="Value"
                />
                <button
                  onClick={() => removeOption(opt.option_id)}
                  className="opacity-40 cursor-pointer brightness-90 hover:brightness-75 dim"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* FOOTER */}
        <div className="flex justify-end gap-[7px] pt-2">
          <button
            onClick={cancel}
            className={`text-sm px-4 py-1.5 rounded-md cursor-pointer hover:brightness-80 dim`}
            style={{ backgroundColor: theme.background_1 }}
          >
            <p className="opacity-100">Cancel</p>
          </button>
          {isDirty && (
            <button
              onClick={save}
              className={`text-sm px-4 py-1.5 rounded-md ${isDirty && "cursor-pointer hover:brightness-80 dim`"}`}
              style={{ backgroundColor: theme.background_1 }}
            >
              <p className="opacity-100">Save</p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
