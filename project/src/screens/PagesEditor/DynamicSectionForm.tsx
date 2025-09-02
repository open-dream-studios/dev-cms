// DynamicSectionForm.tsx
import React from "react";
import { FieldDefinition } from "@/types/sectionConfigSchema";

type Props = {
  fields: FieldDefinition[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
};

const DynamicSectionForm: React.FC<Props> = ({ fields, values, onChange }) => {
  const update = (key: string, val: any) => {
    onChange({ ...values, [key]: val });
  };

  return (
    <div className="flex flex-col gap-3">
      {fields.map((f) => {
        const val = values[f.key] ?? f.default ?? "";
        switch (f.type) {
          case "string":
          case "url":
          case "color":
          case "date":
          case "datetime":
            return (
              <div key={f.key} className="flex flex-col gap-1">
                <label className="font-semibold">{f.label || f.key}</label>
                <input
                  type={f.type === "string" ? "text" : f.type}
                  className="input rounded px-2 py-1"
                  value={val}
                  onChange={(e) => update(f.key, e.target.value)}
                />
              </div>
            );
          case "text":
            return (
              <div key={f.key} className="flex flex-col gap-1">
                <label className="font-semibold">{f.label || f.key}</label>
                <textarea
                  className="input rounded px-2 py-1"
                  value={val}
                  onChange={(e) => update(f.key, e.target.value)}
                />
              </div>
            );
          case "number":
            return (
              <div key={f.key} className="flex flex-col gap-1">
                <label className="font-semibold">{f.label || f.key}</label>
                <input
                  type="number"
                  className="input rounded px-2 py-1"
                  value={val}
                  onChange={(e) => update(f.key, e.target.valueAsNumber)}
                />
              </div>
            );
          case "boolean":
            return (
              <label key={f.key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!val}
                  onChange={(e) => update(f.key, e.target.checked)}
                />
                {f.label || f.key}
              </label>
            );
          case "select":
          case "multiselect":
            return (
              <div key={f.key} className="flex flex-col gap-1">
                <label className="font-semibold">{f.label || f.key}</label>
                <select
                  multiple={f.type === "multiselect"}
                  className="input rounded px-2 py-1"
                  value={val}
                  onChange={(e) =>
                    update(
                      f.key,
                      f.type === "multiselect"
                        ? Array.from(e.target.selectedOptions).map(
                            (o) => o.value
                          )
                        : e.target.value
                    )
                  }
                >
                  {(f.options || []).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          case "object":
            return (
              <div key={f.key} className="p-2 rounded border">
                <p className="font-semibold">{f.label || f.key}</p>
                <DynamicSectionForm
                  fields={f.fields || []}
                  values={val || {}}
                  onChange={(child) => update(f.key, child)}
                />
              </div>
            );
          case "repeater":
            return (
              <div key={f.key} className="p-2 rounded border">
                <p className="font-semibold">{f.label || f.key}</p>
                {(val || []).map((item: any, i: number) => (
                  <div key={i} className="mb-2 p-2 border rounded">
                    <DynamicSectionForm
                      fields={f.fields || []}
                      values={item}
                      onChange={(child) => {
                        const arr = [...(val || [])];
                        arr[i] = child;
                        update(f.key, arr);
                      }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="mt-1 px-3 py-1 rounded bg-gray-200"
                  onClick={() =>
                    update(f.key, [...(val || []), {}])
                  }
                >
                  Add {f.itemLabel || "Item"}
                </button>
              </div>
            );
          default:
            return (
              <p key={f.key} className="text-red-500">
                Unsupported type: {f.type}
              </p>
            );
        }
      })}
    </div>
  );
};

export default DynamicSectionForm;