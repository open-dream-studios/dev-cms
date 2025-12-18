import { useCurrentTheme } from "@/hooks/util/useTheme";
import { GmailMessage, MessageDetail } from "@open-dream/shared";

// project/src/modules/GoogleModule/GmailModule/GmailHelpers.tsx
export function decodeHTMLEntities(str = "") {
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

export function cleanText(str: string = "") {
  const decoded = decodeHTMLEntities(str);
  return decoded
    .replace(/[\u034F\u200B\u200C\u200D\u2060\uFEFF]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function formatDate(ts?: string | number | null) {
  if (!ts) return "";

  // Timestamp (number or numeric string)
  if (!isNaN(Number(ts))) {
    return format(new Date(Number(ts)));
  }

  // Normal date string (RFC 5322, etc.)
  const parsed = new Date(ts);
  if (!isNaN(parsed.getTime())) {
    return format(parsed);
  }

  return "";
}

export function format(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${month}/${day} ${hours}:${minutes} ${ampm}`;
}

export function getHeader(msg: GmailMessage | MessageDetail, key: string) {
  return msg.headers?.[key] ?? "";
}

export const SidebarItem = ({
  icon,
  label,
  count,
  onClick,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  count: number | null;
  onClick?: () => void;
  active?: boolean;
}) => {
  const currentTheme = useCurrentTheme();
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: active
          ? currentTheme.gmail_button_1
          : currentTheme.gmail_background_2,
      }}
      className={`group select-none flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-pointer hover:brightness-85 dim`}
    >
      <div className="flex items-center gap-3 group-hover:brightness-85 dim">
        <div className="opacity-80">{icon}</div>
        <div className="font-medium">{label}</div>
      </div>
      {typeof count === "number" && (
        <div className="text-xs text-white/60 group-hover:brightness-85 dim">
          {count}
        </div>
      )}
    </div>
  );
};

export const LabelPill = ({
  labelName,
  onClick,
}: {
  labelName: string;
  onClick?: () => void;
}) => {
  const currentTheme = useCurrentTheme();
  return (
    <button
      onClick={onClick}
      style={{ backgroundColor: currentTheme.gmail_button_1 }}
      className="group text-sm px-3 py-1 rounded-full text-white/90 cursor-pointer hover:brightness-95 dim"
    >
      <div className="group-hover:brightness-75 dim">{labelName}</div>
    </button>
  );
};

export const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  className = "",
  ...props
}) => {
  const currentTheme = useCurrentTheme();
  return (
    <button
      {...props}
      style={{ backgroundColor: currentTheme.gmail_button_1 }}
      className={
        "cursor-pointer hover:brightness-80 dim inline-flex items-center gap-2 px-[18px] py-[6px] rounded-lg text-[13px]" +
        className
      }
    >
      {children}
    </button>
  );
};