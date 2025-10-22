// project/src/modules/PagesModule/DynamicSectionForm.tsx
import React, { useContext } from "react";
import { FieldDefinition } from "@/types/sectionConfigSchema";
import { appTheme } from "@/util/appTheme";
import { AuthContext } from "@/contexts/authContext";

type Props = {
  fields: FieldDefinition[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
};

const DynamicSectionForm: React.FC<Props> = ({ fields, values, onChange }) => {
  const { currentUser } = useContext(AuthContext);

  const theme = currentUser?.theme ?? "dark";
  const t = appTheme[theme];

  const update = (key: string, val: any) => {
    onChange({ ...values, [key]: val });
  };

  if (!currentUser) return null;

  return (
    <div className="flex flex-col gap-[14px] rounded-[8px]">
      {fields.map((f) => {
        const val = values[f.key] ?? f.default ?? "";

        const labelEl = (
          <label
            className="text-[14px] font-[600] opacity-80"
            style={{ color: t.text_3 }}
          >
            {f.label || f.key}
          </label>
        );

        switch (f.type) {
          case "string":
            return (
              <div key={f.key} className="flex flex-col gap-1">
                {labelEl}
                <textarea
                  className="resize-y rounded-[8px] px-[10px] py-[6px] outline-none border-none dim"
                  style={{
                    backgroundColor: t.background_2_2,
                    color: t.text_1,
                  }}
                  value={val}
                  onChange={(e) => update(f.key, e.target.value)}
                />
              </div>
            );

          case "url":
          case "color":
          case "date":
          case "datetime":
          case "link":
            return (
              <div key={f.key} className="flex flex-col gap-1">
                {labelEl}
                <input
                  type={f.type === "link" || f.type === "url" ? "text" : f.type}
                  className="rounded-[8px] px-[10px] py-[6px] outline-none border-none dim"
                  style={{
                    backgroundColor: t.background_2_2,
                    color: t.text_1,
                  }}
                  value={val}
                  onChange={(e) => update(f.key, e.target.value)}
                />
              </div>
            );

          case "text":
            return (
              <div key={f.key} className="flex flex-col gap-1">
                {labelEl}
                <textarea
                  className="resize-y rounded-[8px] px-[10px] py-[6px] outline-none border-none dim"
                  style={{
                    backgroundColor: t.background_2_2,
                    color: t.text_1,
                  }}
                  value={val}
                  onChange={(e) => update(f.key, e.target.value)}
                />
              </div>
            );

          case "number":
            return (
              <div key={f.key} className="flex flex-col gap-1">
                {labelEl}
                <input
                  type="number"
                  className="rounded-[8px] px-[10px] py-[6px] outline-none border-none dim"
                  style={{
                    backgroundColor: t.background_2_2,
                    color: t.text_1,
                  }}
                  value={val}
                  onChange={(e) => update(f.key, e.target.valueAsNumber)}
                />
              </div>
            );

          case "boolean":
            return (
              <label
                key={f.key}
                className="flex items-center gap-2 cursor-pointer"
              >
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
                {labelEl}
                <select
                  multiple={f.type === "multiselect"}
                  className="rounded-[8px] px-[10px] py-[6px] outline-none border-none cursor-pointer dim"
                  style={{
                    backgroundColor: t.background_2_2,
                    color: t.text_1,
                  }}
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
              <div
                key={f.key}
                className="p-3 rounded-[8px] dim"
                style={{
                  backgroundColor: t.background_2_2,
                }}
              >
                <p className="font-semibold mb-2">{f.label || f.key}</p>
                <DynamicSectionForm
                  fields={f.fields || []}
                  values={val || {}}
                  onChange={(child) => update(f.key, child)}
                />
              </div>
            );

          case "repeater":
            return (
              <div
                key={f.key}
                className="p-3 rounded-[8px] dim"
                style={{
                  backgroundColor: t.background_2_2,
                }}
              >
                <p className="font-semibold mb-2">{f.label || f.key}</p>
                {(val || []).map((item: any, i: number) => (
                  <div
                    key={i}
                    className="mb-2 p-2 rounded-[8px]"
                    style={{
                      backgroundColor: t.background_3,
                    }}
                  >
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
                  className="mt-1 px-3 py-1 rounded-full dim cursor-pointer font-[600]"
                  style={{
                    backgroundColor:
                      t.background_2_selected,
                    color: t.text_3,
                  }}
                  onClick={() => update(f.key, [...(val || []), {}])}
                >
                  Add {f.itemLabel || "Item"}
                </button>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};

export default DynamicSectionForm;
