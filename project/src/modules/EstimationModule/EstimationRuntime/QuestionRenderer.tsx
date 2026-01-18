// project/src/modules/EstimationModule/EstimationRuntime/QuestionRenderer.tsx
import type { EstimationGraphNode } from "@open-dream/shared";

type Props = {
  node: EstimationGraphNode;
  value: any;
  facts: Record<string, any>;
  onChange: (v: any) => void;
};

function evalRule(rule: any, facts: Record<string, any>) {
  if (!rule) return true;

  // support AND/OR
  if (Array.isArray(rule.and)) return rule.and.every((r: any) => evalRule(r, facts));
  if (Array.isArray(rule.or)) return rule.or.some((r: any) => evalRule(r, facts));

  const factVal = facts?.[rule.fact];

  switch (rule.operator) {
    case ">":
      return Number(factVal) > Number(rule.value);
    case ">=":
      return Number(factVal) >= Number(rule.value);
    case "<":
      return Number(factVal) < Number(rule.value);
    case "<=":
      return Number(factVal) <= Number(rule.value);
    case "==":
      return factVal == rule.value;
    case "!=":
      return factVal != rule.value;
    case "in":
      return Array.isArray(rule.value) ? rule.value.includes(factVal) : false;
    case "contains":
      return Array.isArray(factVal) ? factVal.includes(rule.value) : false;
    default:
      // unknown rule shape => show (don’t brick UI)
      return true;
  }
}

export default function QuestionRenderer({ node, value, facts, onChange }: Props) {
  const { prompt, input_type } = node.config ?? {};

  // select config
  const select_mode = (node.config?.select_mode ?? "single") as "single" | "multi";
  const options = Array.isArray(node.config?.options) ? node.config.options : [];
  const visibleOptions = options.filter((opt: any) => evalRule(opt?.visibility_rules, facts));

  return (
    <div className="flex flex-col gap-2">
      <div className="font-medium text-lg">{prompt}</div>

      {input_type === "text" && (
        <input
          className="border rounded-md px-3 py-2"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {input_type === "number" && (
        <input
          type="number"
          className="border rounded-md px-3 py-2"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        />
      )}

      {input_type === "boolean" && (
        <select
          className="border rounded-md px-3 py-2"
          value={value === true ? "true" : value === false ? "false" : ""}
          onChange={(e) => onChange(e.target.value === "" ? null : e.target.value === "true")}
        >
          <option value="">Select…</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      )}

      {input_type === "select" && select_mode === "single" && (
        <select
          className="border rounded-md px-3 py-2"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <option value="">Select…</option>
          {visibleOptions.map((opt: any) => (
            <option key={opt.id} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {input_type === "select" && select_mode === "multi" && (
        <div className="border rounded-md px-3 py-2 flex flex-col gap-2">
          {visibleOptions.length === 0 && (
            <div className="text-sm opacity-60">No options available.</div>
          )}

          {visibleOptions.map((opt: any) => {
            const arr = Array.isArray(value) ? value : [];
            const checked = arr.includes(opt.value);

            return (
              <label key={opt.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const next = new Set(arr);
                    if (e.target.checked) next.add(opt.value);
                    else next.delete(opt.value);
                    onChange(Array.from(next));
                  }}
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}