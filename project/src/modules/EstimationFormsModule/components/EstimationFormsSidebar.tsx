// project/src/modules/EstimationFormsModule/components/EstimationFormsSidebar.tsx
"use client";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { Copy, FilePlus2, FolderKanban, Search, Trash2 } from "lucide-react";
import { useEstimationFormsModule } from "../_hooks/estimationForms.hooks";

const clickClass =
  "cursor-pointer dim hover:brightness-[80%] transition-all duration-200";

export default function EstimationFormsSidebar() {
  const currentTheme = useCurrentTheme();
  const {
    filteredFormBuilds,
    selectedForm,
    search,
    setSearch,
    setSelectedFormId,
    createFormBuild,
    duplicateFormBuild,
    deleteFormBuild,
  } = useEstimationFormsModule();

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
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <FolderKanban size={14} />
            </div>
            <div>
              <p className="text-[12px] font-[700]">Form Builds</p>
              <p className="text-[10px] opacity-60">Estimation Forms</p>
            </div>
          </div>
          <button
            onClick={() => createFormBuild()}
            className={`h-8 px-2 rounded-lg bg-sky-600 text-white ${clickClass}`}
          >
            <FilePlus2 size={13} />
          </button>
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
          return (
            <div
              key={doc.id}
              className={`mb-2 rounded-xl p-2.5 ${clickClass}`}
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
              <p className="text-[12px] font-[700] truncate">{doc.name}</p>
              <p className="text-[10px] opacity-65 mt-0.5 truncate">
                {doc.description || "No description"}
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <button
                  className={`h-7 px-2 rounded-md bg-white/75 ${clickClass}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateFormBuild(doc.id);
                  }}
                >
                  <Copy size={11} />
                </button>
                <button
                  className={`h-7 px-2 rounded-md bg-rose-50 text-rose-600 ${clickClass}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFormBuild(doc.id);
                  }}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
