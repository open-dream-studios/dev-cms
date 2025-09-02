import React, { useMemo, useState } from "react";
import {
  FieldDefinition,
  FieldType,
  SectionConfigSchema,
  FieldOption,
} from "@/types/sectionConfigSchema";
import { appTheme } from "@/util/appTheme";
import { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import { FaPlus, FaTrash, FaChevronUp, FaChevronDown } from "react-icons/fa6";
import { FiEdit } from "react-icons/fi";

type SchemaBuilderProps = {
  value: SectionConfigSchema | null | undefined;
  onChange: (schema: SectionConfigSchema) => void;
  title?: string;
};

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "string", label: "Short Text" },
  { value: "text", label: "Textarea" },
  { value: "richtext", label: "Rich Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "image", label: "Image" },
  { value: "file", label: "File" },
  { value: "video", label: "Video" },
  { value: "color", label: "Color" },
  { value: "date", label: "Date" },
  { value: "datetime", label: "Date & Time" },
  { value: "url", label: "URL" },
  { value: "link", label: "Link (label+url)" },
  { value: "select", label: "Select" },
  { value: "multiselect", label: "Multi Select" },
  { value: "reference", label: "Reference (ID)" },
  { value: "object", label: "Group (Object)" },
  { value: "repeater", label: "Repeater (List)" },
];

function emptyFieldForType(type: FieldType): FieldDefinition {
  const base = {
    key: "",
    label: "",
    type,
    required: false,
    help: "",
  } as any;

  if (type === "object" || type === "repeater") {
    base.fields = [];
    if (type === "repeater") base.itemLabel = "Item";
  } else if (type === "select" || type === "multiselect") {
    base.options = [];
  } else if (type === "image" || type === "file" || type === "video") {
    base.multiple = false;
    base.constraints = { maxSizeMB: 10, formats: [] };
  }
  return base;
}

const FieldRow: React.FC<{
  field: FieldDefinition;
  idx: number;
  total: number;
  onChange: (f: FieldDefinition) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  themeColors: any;
}> = ({
  field,
  idx,
  total,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  themeColors,
}) => {
  const update = (patch: Partial<FieldDefinition>) =>
    onChange({ ...field, ...patch } as FieldDefinition);

  const renderLeafExtras = () => {
    // extras based on leaf field type
    switch (field.type) {
      case "select":
      case "multiselect": {
        const options = field.options || [];
        const [label, setLabel] = useState("");
        const [value, setValue] = useState("");
        return (
          <div className="mt-3">
            <p className="font-semibold mb-1">Options</p>
            {options.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {options.map((opt, i) => (
                  <span
                    key={i}
                    className="px-2 py-[2px] rounded-full text-xs"
                    style={{ background: themeColors.background_2_selected }}
                  >
                    {opt.label} ({opt.value})
                    <button
                      className="ml-2 text-xs opacity-70 hover:opacity-100"
                      type="button"
                      onClick={() => {
                        const next = options.filter((_, j) => j !== i);
                        onChange({ ...field, options: next });
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                className="input rounded px-2 py-1"
                placeholder="Label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
              <input
                className="input rounded px-2 py-1"
                placeholder="Value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
              <button
                type="button"
                className="px-3 rounded hover:brightness-90 dim"
                style={{ background: themeColors.background_2_selected }}
                onClick={() => {
                  if (!label.trim() || !value.trim()) return;
                  const next = [...options, { label, value } as FieldOption];
                  onChange({ ...field, options: next });
                  setLabel("");
                  setValue("");
                }}
              >
                Add
              </button>
            </div>
          </div>
        );
      }
      case "image":
      case "file":
      case "video": {
        const constraints = field.constraints || {};
        return (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm opacity-70">Multiple</label>
              <input
                type="checkbox"
                checked={!!field.multiple}
                onChange={(e) =>
                  onChange({ ...field, multiple: e.target.checked })
                }
              />
            </div>
            <div>
              <label className="text-sm opacity-70">Max Size (MB)</label>
              <input
                type="number"
                className="input rounded px-2 py-1 w-full"
                value={constraints.maxSizeMB ?? ""}
                onChange={(e) =>
                  onChange({
                    ...field,
                    constraints: {
                      ...constraints,
                      maxSizeMB: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="text-sm opacity-70">Aspect Ratio</label>
              <input
                className="input rounded px-2 py-1 w-full"
                placeholder="16:9 or 1:1"
                value={constraints.aspectRatio ?? ""}
                onChange={(e) =>
                  onChange({
                    ...field,
                    constraints: {
                      ...constraints,
                      aspectRatio: e.target.value || undefined,
                    },
                  })
                }
              />
            </div>
            <div className="col-span-3">
              <label className="text-sm opacity-70">Formats (comma-sep)</label>
              <input
                className="input rounded px-2 py-1 w-full"
                placeholder="png,jpg,webp"
                value={(constraints.formats || []).join(",")}
                onChange={(e) =>
                  onChange({
                    ...field,
                    constraints: {
                      ...constraints,
                      formats: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    },
                  })
                }
              />
            </div>
          </div>
        );
      }
      case "number": {
        const constraints = field.constraints || {};
        return (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div>
              <label className="text-sm opacity-70">Min</label>
              <input
                type="number"
                className="input rounded px-2 py-1 w-full"
                value={constraints.min ?? ""}
                onChange={(e) =>
                  onChange({
                    ...field,
                    constraints: {
                      ...constraints,
                      min:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="text-sm opacity-70">Max</label>
              <input
                type="number"
                className="input rounded px-2 py-1 w-full"
                value={constraints.max ?? ""}
                onChange={(e) =>
                  onChange({
                    ...field,
                    constraints: {
                      ...constraints,
                      max:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="text-sm opacity-70">Step</label>
              <input
                type="number"
                className="input rounded px-2 py-1 w-full"
                value={constraints.step ?? ""}
                onChange={(e) =>
                  onChange({
                    ...field,
                    constraints: {
                      ...constraints,
                      step:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    },
                  })
                }
              />
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  const isContainer = field.type === "object" || field.type === "repeater";
  const containerFields = isContainer
    ? ((field as any).fields as FieldDefinition[])
    : [];

  return (
    <div
      className="rounded-lg p-3 mb-3"
      style={{ background: themeColors.background_1_2 }}
    >
      <div className="flex items-center gap-2">
        <input
          className="input rounded px-2 py-1 w-[200px]"
          placeholder="key (e.g. title)"
          value={field.key}
          onChange={(e) => update({ key: e.target.value.replace(/\s+/g, "_") })}
        />
        <input
          className="input rounded px-2 py-1 flex-1"
          placeholder="Label (optional)"
          value={field.label || ""}
          onChange={(e) => update({ label: e.target.value })}
        />
        <select
          className="input rounded px-2 py-1 w-[200px]"
          value={field.type}
          onChange={(e) => {
            const nextType = e.target.value as FieldType;
            // Replace with a fresh object if type changes radically
            const next = emptyFieldForType(nextType);
            next.key = field.key;
            next.label = field.label;
            next.required = field.required;
            next.help = field.help;
            onChange(next);
          }}
        >
          {FIELD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 ml-2 text-sm opacity-80">
          <input
            type="checkbox"
            checked={!!field.required}
            onChange={(e) => update({ required: e.target.checked })}
          />
          Required
        </label>

        <button
          type="button"
          onClick={onMoveUp}
          disabled={idx === 0}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:brightness-90 dim"
          style={{
            background: themeColors.background_2_selected,
            opacity: idx === 0 ? 0.4 : 1,
          }}
        >
          <FaChevronUp size={14} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={idx === total - 1}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:brightness-90 dim"
          style={{
            background: themeColors.background_2_selected,
            opacity: idx === total - 1 ? 0.4 : 1,
          }}
        >
          <FaChevronDown size={14} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:brightness-90 dim"
          style={{ background: themeColors.background_2_selected }}
          title="Delete field"
        >
          <FaTrash size={14} />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <input
          className="input rounded px-2 py-1"
          placeholder="Help text (optional)"
          value={field.help || ""}
          onChange={(e) => update({ help: e.target.value })}
        />
        <input
          className="input rounded px-2 py-1"
          placeholder="Default (stringified)"
          value={
            typeof field.default === "object"
              ? JSON.stringify(field.default)
              : field.default ?? ""
          }
          onChange={(e) => {
            const v = e.target.value;
            // Store raw string; consumer can coerce by type at runtime if needed
            update({ default: v });
          }}
        />
      </div>

      {/* Type-specific editor */}
      {renderLeafExtras()}

      {/* Nested children for object / repeater */}
      {isContainer && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold">
              {field.type === "object" ? "Fields in Group" : "Item Fields"}
            </p>
            {field.type === "repeater" && (
              <div className="flex items-center gap-2">
                <span className="text-sm opacity-70">Item Label</span>
                <input
                  className="input rounded px-2 py-1"
                  value={(field as any).itemLabel || "Item"}
                  onChange={(e) =>
                    onChange({ ...(field as any), itemLabel: e.target.value })
                  }
                />
              </div>
            )}
          </div>

          <FieldList
            fields={containerFields}
            onChange={(next) => onChange({ ...(field as any), fields: next })}
            themeColors={themeColors}
          />
        </div>
      )}
    </div>
  );
};

const FieldList: React.FC<{
  fields: FieldDefinition[];
  onChange: (fields: FieldDefinition[]) => void;
  themeColors: any;
}> = ({ fields, onChange, themeColors }) => {
  const addField = (type: FieldType) => {
    onChange([...(fields || []), emptyFieldForType(type)]);
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= fields.length) return;
    const next = [...fields];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const updateAt = (i: number, f: FieldDefinition) => {
    const next = [...fields];
    next[i] = f;
    onChange(next);
  };
  const deleteAt = (i: number) => {
    const next = [...fields];
    next.splice(i, 1);
    onChange(next);
  };

  return (
    <div>
      {(fields || []).map((f, i) => (
        <FieldRow
          key={i}
          field={f}
          idx={i}
          total={fields.length}
          onChange={(nf) => updateAt(i, nf)}
          onDelete={() => deleteAt(i)}
          onMoveUp={() => move(i, -1)}
          onMoveDown={() => move(i, +1)}
          themeColors={themeColors}
        />
      ))}

      <div className="flex items-center gap-2 mt-2">
        <AddFieldMenu onAdd={addField} themeColors={themeColors} />
      </div>
    </div>
  );
};

const AddFieldMenu: React.FC<{
  onAdd: (type: FieldType) => void;
  themeColors: any;
}> = ({ onAdd, themeColors }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-full hover:brightness-90 dim"
        style={{ background: themeColors.background_2_selected }}
      >
        <FaPlus /> Add Field
      </button>
      {open && (
        <div
          className="absolute mt-2 z-10 w-[260px] rounded-lg p-2"
          style={{ background: themeColors.background_1_2 }}
        >
          {FIELD_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                onAdd(t.value);
                setOpen(false);
              }}
              className="w-full text-left px-2 py-1 rounded hover:brightness-95 dim"
              style={{ background: "transparent" }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const SchemaBuilder: React.FC<SchemaBuilderProps> = ({
  value,
  onChange,
  title,
}) => {
  const { currentUser } = useContext(AuthContext);
  if (!currentUser) return null;

  const themeColors = appTheme[currentUser.theme];
  const schema = value ?? { fields: [] };

  return (
    <div
      className="rounded-[10px] p-4"
      style={{ background: themeColors.background_1_2 }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[18px] font-semibold">
          {title || "Config Schema"}
        </h3>
        <button
          type="button"
          onClick={() => onChange({ fields: [] })}
          className="px-3 py-1 rounded-full hover:brightness-90 dim"
          style={{ background: themeColors.background_2_selected }}
          title="Clear schema"
        >
          Reset
        </button>
      </div>

      <FieldList
        fields={schema.fields}
        onChange={(fields) => onChange({ fields })}
        themeColors={themeColors}
      />

      <details className="mt-3">
        <summary className="cursor-pointer opacity-70">Preview JSON</summary>
        <pre className="mt-2 text-xs overflow-auto max-h-[240px]">
          {JSON.stringify(schema, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default SchemaBuilder;
