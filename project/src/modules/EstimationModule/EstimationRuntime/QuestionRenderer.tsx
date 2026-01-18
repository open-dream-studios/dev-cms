import type { EstimationGraphNode } from "@open-dream/shared";

export default function QuestionRenderer({
  node,
  value,
  onChange,
}: {
  node: EstimationGraphNode;
  value: any;
  onChange: (v: any) => void;
}) {
  const { prompt, input_type } = node.config;

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
          onChange={(e) => onChange(Number(e.target.value))}
        />
      )}

      {input_type === "boolean" && (
        <select
          className="border rounded-md px-3 py-2"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "true")}
        >
          <option value="">Select…</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      )}
    </div>
  );
}