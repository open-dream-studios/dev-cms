export type FieldType =
  | "string"
  | "text"
  | "richtext"
  | "number"
  | "boolean"
  | "image"
  | "file"
  | "video"
  | "color"
  | "date"
  | "datetime"
  | "select"
  | "multiselect"
  | "url"
  | "link"       // { label, url, target? } – handled by UI or as object preset
  | "reference"  // reference to another entity (id)
  | "object"
  | "repeater";

export type FieldOption = { label: string; value: string };

export type FieldConstraints = {
  min?: number;
  max?: number;
  step?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;     // regex string
  formats?: string[];   // for files/images/videos (e.g., ["png","jpg"])
  maxSizeMB?: number;
  aspectRatio?: string; // "16:9", "1:1", etc.
};

export interface FieldBase {
  key: string;            // machine key, unique within siblings
  label?: string;         // human label for editors
  type: FieldType;
  required?: boolean;
  help?: string;
  default?: any;
  multiple?: boolean;     // for media, or future extensibility
  options?: FieldOption[];     // for (multi)select
  constraints?: FieldConstraints;
}

export interface ObjectField extends FieldBase {
  type: "object";
  fields: FieldDefinition[];  // nested fields
}

export interface RepeaterField extends FieldBase {
  type: "repeater";
  itemLabel?: string;         // UI hint for each row (e.g. "Feature")
  fields: FieldDefinition[];  // schema of each repeated item
}

export type LeafField =
  & FieldBase
  & { type: Exclude<FieldType, "object" | "repeater"> };

export type FieldDefinition = LeafField | ObjectField | RepeaterField;

export type SectionConfigSchema = {
  fields: FieldDefinition[];
};