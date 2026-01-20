// project/src/modules/CustomerProducts/ProductsHeader.tsx
"use client";
import React, { useRef } from "react";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import {
  handleFilterClick,
  handleJobFilterClick,
} from "./_actions/filters.actions";
import { useOutsideClick } from "@/hooks/util/useOutsideClick";
import { FaChevronDown } from "react-icons/fa6";

const JobTypeDropdown = () => {
  const { productFilters, setProductFilters } = useCurrentDataStore();
  const currentTheme = useCurrentTheme();
  const [open, setOpen] = React.useState(false);

  const ref = useRef<HTMLDivElement | null>(null);
  useOutsideClick(ref, () => setOpen(false));

  const ALL = ["Sale", "Service", "Refurbishment"] as const;

  const isAllSelected = productFilters.jobType.length === 0;

  const setSingle = (type: (typeof ALL)[number]) => {
    setProductFilters({
      ...productFilters,
      jobType: [type],
    });
    setOpen(false);
  };

  const setAll = () => {
    setProductFilters({
      ...productFilters,
      jobType: [],
    });
    setOpen(false);
  };

  const label = isAllSelected ? "All Job Types" : productFilters.jobType[0];

  return (
    <div ref={ref} className="relative w-[184px]">
      <div
        onClick={() => setOpen((p) => !p)}
        style={{ backgroundColor: currentTheme.header_1_1 }}
        className="h-[32px] rounded-[18px] px-[12px] flex items-center justify-between cursor-pointer select-none"
      >
        <span className="pl-[11px] text-[13px] font-[500] opacity-80">
          {label}
        </span>
        <FaChevronDown
          size={16}
          className={`opacity-20 transition-transform duration-200 pr-[4px] ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
      </div>

      {open && (
        <div
          style={{ backgroundColor: currentTheme.header_1_1 }}
          className="absolute z-[50] mt-[6px] w-full rounded-[12px] shadow-lg py-[4px] px-[5px]"
        >
          <div
            onClick={setAll}
            style={{
              backgroundColor: isAllSelected
                ? currentTheme.header_1_2
                : currentTheme.header_1_1,
            }}
            className="transition-all duration-200 ease-in-out rounded-[8px] px-[10px] py-[6px] text-[13px] font-[500] cursor-pointer hover:brightness-90"
          >
            All Job Types
          </div>

          {ALL.map((type) => (
            <div
              key={type}
              onClick={() => setSingle(type)}
              style={{
                backgroundColor:
                  productFilters.jobType[0] === type
                    ? currentTheme.header_1_2
                    : currentTheme.header_1_1,
              }}
              className="transition-all duration-200 ease-in-out rounded-[8px] px-[10px] py-[6px] text-[13px] font-[500] cursor-pointer hover:brightness-90"
            >
              {type}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ProductFilterSelection = ({
  popup,
  jobTypeDropdown,
}: {
  popup: boolean;
  jobTypeDropdown: boolean;
}) => {
  const { productFilters } = useCurrentDataStore();
  const currentTheme = useCurrentTheme();

  return (
    <div
      className={`flex ${popup ? "flex-col gap-[6px]" : "flex-row gap-[13px]"}`}
    >
      <div
        style={{
          backgroundColor: currentTheme.header_1_1,
        }}
        className="flex w-[184px] pl-[4px] h-[32px] rounded-[18px] flex-row items-center"
      >
        <div
          onClick={() => handleFilterClick("Active")}
          style={{
            backgroundColor: productFilters.products.includes("Active")
              ? currentTheme.header_1_2
              : "transparent",
          }}
          className="select-none cursor-pointer w-[84px] h-[26px] flex items-center justify-center text-[13px] font-[500] rounded-[18px]"
        >
          Active
        </div>
        <div
          className="w-[1px] h-[22px] rounded-[4px] mx-[2px]"
          style={{
            opacity: productFilters.products.length === 0 ? "0.1" : 0,
            backgroundColor: currentTheme.text_1,
          }}
        />
        <div
          onClick={() => handleFilterClick("Complete")}
          style={{
            backgroundColor: productFilters.products.includes("Complete")
              ? currentTheme.header_1_2
              : "transparent",
          }}
          className="select-none cursor-pointer w-[88px] h-[26px] flex items-center justify-center text-[13px] font-[500] rounded-[18px]"
        >
          Complete
        </div>
      </div>

      {jobTypeDropdown ? (
        <JobTypeDropdown />
      ) : (
        <div
          style={{
            backgroundColor: currentTheme.header_1_1,
          }}
          className="flex w-[330px] pl-[4px] h-[32px] rounded-[18px] flex-row items-center"
        >
          <div
            onClick={() => handleJobFilterClick("Sale")}
            style={{
              backgroundColor: productFilters.jobType.includes("Sale")
                ? currentTheme.header_1_2
                : "transparent",
            }}
            className="select-none cursor-pointer w-[94px] h-[26px] flex items-center justify-center text-[13px] font-[500] rounded-[18px]"
          >
            Sale
          </div>
          <div
            className="w-[1px] h-[22px] rounded-[4px] mx-[2px]"
            style={{
              opacity:
                (productFilters.jobType.length === 1 &&
                  productFilters.jobType[0] === "Sale") ||
                productFilters.jobType.length === 0
                  ? "0.1"
                  : 0,
              backgroundColor: currentTheme.text_1,
            }}
          />
          <div
            onClick={() => handleJobFilterClick("Service")}
            style={{
              backgroundColor: productFilters.jobType.includes("Service")
                ? currentTheme.header_1_2
                : "transparent",
            }}
            className="select-none cursor-pointer w-[94px] h-[26px] flex items-center justify-center text-[13px] font-[500] rounded-[18px]"
          >
            Service
          </div>
          <div
            className="w-[1px] h-[22px] rounded-[4px] mx-[2px]"
            style={{
              opacity:
                (productFilters.jobType.length === 1 &&
                  productFilters.jobType[0] === "Service") ||
                productFilters.jobType.length === 0
                  ? "0.1"
                  : 0,
              backgroundColor: currentTheme.text_1,
            }}
          />
          <div
            onClick={() => handleJobFilterClick("Refurbishment")}
            style={{
              backgroundColor: productFilters.jobType.includes("Refurbishment")
                ? currentTheme.header_1_2
                : "transparent",
            }}
            className="select-none cursor-pointer w-[124px] h-[26px] flex items-center justify-center text-[13px] font-[500] rounded-[18px]"
          >
            Refurbishment
          </div>
        </div>
      )}
    </div>
  );
};
