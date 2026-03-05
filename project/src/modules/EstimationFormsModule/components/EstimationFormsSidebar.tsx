// project/src/modules/EstimationFormsModule/components/EstimationFormsSidebar.tsx
"use client";
import { useState } from "react";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import {
  ChevronRight,
  Copy,
  FilePlus2,
  Pencil,
  PanelLeftClose,
  Search,
  Trash2,
} from "lucide-react";
import { useEstimationFormsModule } from "../_hooks/estimationForms.hooks";
import { useEstimationFormsUIStore } from "../_store/estimationForms.store";

const clickClass =
  "cursor-pointer dim hover:brightness-[80%] transition-all duration-200";

export default function EstimationFormsSidebar({ mini }: { mini: boolean }) {
  const currentTheme = useCurrentTheme();
  const {
    filteredFormBuilds,
    selectedForm,
    search,
    setSearch,
    setSelectedFormId,
    createFormBuild,
    duplicateFormBuild,
    renameFormBuild,
    deleteFormBuild,
  } = useEstimationFormsModule();
  const { setEstimationFormsLeftBarOpen, estimationFormsLeftBarOpen } =
    useEstimationFormsUIStore();
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  if (mini) {
    return (
      <div
        className="w-[56px] h-full flex flex-col items-center py-3 gap-2"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.9) 100%)",
          borderRight: `1px solid ${currentTheme.background_2}`,
        }}
      >
        <button
          onClick={() =>
            setEstimationFormsLeftBarOpen(!estimationFormsLeftBarOpen)
          }
          style={{
            backgroundColor: currentTheme.background_1_3,
            border: "1px solid" + currentTheme.background_1_2,
            color: currentTheme.text_3,
          }}
          className={`h-[34px] w-[34px] mt-[2px] mb-[-2px] flex justify-center items-center rounded-lg ${clickClass}`}
          title="Expand Sidebar"
        >
          <ChevronRight size={16} className="opacity-85" />
        </button>

        <div className="w-[30px] h-[1px] bg-black/10 mt-[6px] mb-[4px]" />

        <button
          onClick={() => createFormBuild()}
          className={`h-[34px] w-[34px] flex justify-center items-center rounded-lg bg-sky-100 text-sky-700 border border-sky-200/70 ${clickClass}`}
          title="New Form Build"
        >
          <FilePlus2 size={14} />
        </button>

        <div className="w-[30px] h-[1px] bg-black/10 my-1" />

        <div className="w-full flex flex-col items-center gap-1.5 overflow-y-auto pb-2">
          {filteredFormBuilds.slice(0, 12).map((doc) => {
            const selected = selectedForm?.id === doc.id;
            const label = (doc.name || "F").trim().slice(0, 2).toUpperCase();

            return (
              <button
                key={doc.id}
                onClick={() => setSelectedFormId(doc.id)}
                className={`h-[34px] w-[34px] rounded-lg border text-[10px] font-[700] flex items-center justify-center ${clickClass}`}
                style={{
                  backgroundColor: selected
                    ? "rgba(14, 165, 233, 0.16)"
                    : "rgba(255,255,255,0.86)",
                  borderColor: selected
                    ? "rgba(14,165,233,0.35)"
                    : "rgba(15,23,42,0.12)",
                  color: selected ? "#0369A1" : "#334155",
                }}
                title={doc.name}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-[246px] h-full flex flex-col"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%)",
        borderRight: `1px solid ${currentTheme.background_2}`,
      }}
    >
      <div className="px-3.5 pt-3 pb-2.5 border-b border-black/5">
        <div className="flex items-center justify-between">
          <div className="pl-[1px]">
            <p className="text-[15px] font-[700]">Form Builds</p>
            <p className="pl-[0.4px] text-[10px] opacity-60 mt-[-0.8px]">
              Estimation Forms
            </p>
          </div>

          <div className="flex flex-row gap-[4px]">
            <button
              onClick={() => createFormBuild()}
              className={`h-[33px] w-[33px] pr-[1px] pb-[1px] flex justify-center items-center rounded-lg ${clickClass}`}
              style={{
                backgroundColor: currentTheme.background_1_3,
                color: currentTheme.text_3,
              }}
            >
              <FilePlus2 size={14} />
            </button>

            <button
              onClick={() =>
                setEstimationFormsLeftBarOpen(!estimationFormsLeftBarOpen)
              }
              style={{
                backgroundColor: currentTheme.background_1_3,
                color: currentTheme.text_3,
              }}
              className={`h-[33px] w-[33px] pr-[1px] pb-[1px] flex justify-center items-center rounded-lg ${clickClass}`}
            >
              <PanelLeftClose size={17} className="opacity-88" />
            </button>
          </div>
        </div>

        <div
          className="mt-2.5 h-8 rounded-lg px-2.5 flex items-center gap-2"
          style={{ backgroundColor: currentTheme.background_1_3 }}
        >
          <Search size={13} className="opacity-55" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search forms..."
            className="bg-transparent outline-none w-full text-[11px]"
          />
        </div>
      </div>

      <div className="p-2 flex-1 overflow-y-auto">
        {filteredFormBuilds.map((doc) => {
          const selected = selectedForm?.id === doc.id;
          const editing = editingFormId === doc.id;
          return (
            <div
              key={doc.id}
              className={`mb-2 rounded-xl p-2.5 cursor-pointer group`}
              style={{
                backgroundColor: selected
                  ? "rgba(14, 165, 233, 0.11)"
                  : currentTheme.background_1_3,
                border: selected
                  ? "1px solid rgba(14, 165, 233, 0.32)"
                  : "1px solid rgba(0,0,0,0.04)",
              }}
              onClick={() => setSelectedFormId(doc.id)}
            >
              <div className="flex items-center justify-between gap-1.5">
                {editing ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => {
                      const v = e.target.value
                        .replace(/^ /, "") // no leading space
                        .replace(/\. $/, " "); // fix mac double-space -> ". "

                      setEditingName(v);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={() => {
                      renameFormBuild(doc.id, editingName.trim());
                      setEditingFormId(null);
                      setEditingName("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === " " && editingName.endsWith(" ")) {
                        e.preventDefault(); // block second trailing space
                        return;
                      }

                      if (e.key === "Enter") {
                        renameFormBuild(doc.id, editingName.trim());
                        setEditingFormId(null);
                        setEditingName("");
                      }

                      if (e.key === "Escape") {
                        setEditingFormId(null);
                        setEditingName("");
                      }
                    }}
                    className="text-[12px] font-[700] w-full border-none outline-none"
                  />
                ) : (
                  <p className="text-[12px] font-[700] truncate">{doc.name}</p>
                )}
              </div>

              {/* <p className="text-[10px] opacity-65 mt-0.5 truncate">
                {doc.description || "No description"}
              </p> */}
              <div className="w-[100%] flex justify-end pr-[1px]">
                <div className="mt-1 flex items-center gap-1.5">
                  <button
                    className={`h-7 px-2 rounded-md bg-white/85 ${clickClass}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateFormBuild(doc.id);
                    }}
                  >
                    <Copy size={11} />
                  </button>

                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      if (editingFormId === doc.id) {
                        renameFormBuild(doc.id, editingName.trim()); // save
                        setEditingFormId(null);
                        setEditingName("");
                        return;
                      }

                      setEditingFormId(doc.id);
                      setEditingName(doc.name);
                    }}
                    style={{
                      border: editing
                        ? "1px solid rgba(14, 165, 233, 0.52)"
                        : "1px solid transparent",
                    }}
                    className={`h-[27px] px-[7px] rounded-md bg-white/85 ${clickClass}`}
                    title="Rename Form"
                  >
                    <Pencil size={10} />
                  </button>

                  <button
                    className={`h-7 px-2 rounded-md bg-white/85 text-rose-600 ${clickClass}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFormBuild(doc.id);
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
