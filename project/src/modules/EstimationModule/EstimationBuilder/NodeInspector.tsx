// project/src/modules/EstimationModule/EstimationBuilder/NodeInspector.tsx
"use client";

import { useEffect, useMemo } from "react";
import type { EstimationGraphNode } from "@open-dream/shared";
import { Controller } from "react-hook-form";
import { useEstimationNodeForm } from "@/hooks/forms/useEstimationNodeForm";
import { nodeToForm } from "@/util/schemas/estimationNodeSchema";

export default function NodeInspector({
  node,
  factKeys,
  onSave,
  onRenameNode,
}: {
  node: EstimationGraphNode;
  factKeys: string[];
  onSave: (payload: { label?: string; config: any }) => Promise<void> | void;
  onRenameNode?: (label: string) => Promise<void> | void;
}) {
  const form = useEstimationNodeForm(node);
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty, isValid, errors },
  } = form;

  // ✅ FIX: update inspector when selecting a new node
  useEffect(() => {
    reset(nodeToForm(node), { keepDirty: false, keepValues: false });
  }, [node.node_id, reset, node]);

  const previewFacts = useMemo(() => {
    const shown = factKeys.slice(0, 10);
    return shown.join(", ") + (factKeys.length > 10 ? "..." : "");
  }, [factKeys]);

  const submit = handleSubmit(async (data) => {
    const produces_facts = JSON.parse(data.produces_facts_json || "[]");
    const visibility_rules = JSON.parse(data.visibility_rules_json || "{}");

    const nextConfig = {
      ...(node.config ?? {}),
      prompt: data.prompt,
      input_type: data.input_type,
      produces_facts,
      visibility_rules,
    };

    // label is stored at row-level, not in config
    if (data.label !== node.label && onRenameNode) {
      await onRenameNode(data.label);
    }

    await onSave({ label: data.label, config: nextConfig });
  });

  const labelVal = watch("label");

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-[15px]">Node Inspector</div>
          <div className="text-xs opacity-60 mt-[2px]">
            node_id: <span className="font-mono">{node.node_id}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!isDirty || !isValid}
          className="px-3 py-2 rounded-md border text-sm disabled:opacity-40"
        >
          Save
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <label className="text-xs opacity-70">Label</label>
        <input
          {...register("label")}
          className="border rounded-md px-2 py-2 text-sm"
          placeholder="Label"
        />
        {errors.label?.message && (
          <div className="text-xs text-red-500">{errors.label.message}</div>
        )}

        <label className="text-xs opacity-70">Prompt</label>
        <input
          {...register("prompt")}
          className="border rounded-md px-2 py-2 text-sm"
          placeholder="Prompt shown to employee"
        />
        {errors.prompt?.message && (
          <div className="text-xs text-red-500">{errors.prompt.message}</div>
        )}

        <label className="text-xs opacity-70">Input Type</label>
        <Controller
          control={control}
          name="input_type"
          render={({ field }) => (
            <select
              className="border rounded-md px-2 py-2 text-sm"
              value={field.value}
              onChange={field.onChange}
            >
              <option value="text">text</option>
              <option value="number">number</option>
              <option value="boolean">boolean</option>
              <option value="select">select</option>
            </select>
          )}
        />

        <div className="text-xs opacity-60">
          available fact_keys: <span className="font-mono">{previewFacts}</span>
        </div>

        <label className="text-xs opacity-70">
          produces_facts (JSON array)
        </label>
        <textarea
          {...register("produces_facts_json")}
          className="border rounded-md px-2 py-2 font-mono text-xs h-[160px]"
          spellCheck={false}
        />
        {errors.produces_facts_json?.message && (
          <div className="text-xs text-red-500">
            {errors.produces_facts_json.message as any}
          </div>
        )}

        <label className="text-xs opacity-70">
          visibility_rules (JSON object)
        </label>
        <textarea
          {...register("visibility_rules_json")}
          className="border rounded-md px-2 py-2 font-mono text-xs h-[120px]"
          spellCheck={false}
        />
        {errors.visibility_rules_json?.message && (
          <div className="text-xs text-red-500">
            {errors.visibility_rules_json.message as any}
          </div>
        )}

        <div className="text-xs opacity-60">
          editing: <span className="font-mono">{labelVal}</span>
        </div>
      </div>
    </form>
  );
}