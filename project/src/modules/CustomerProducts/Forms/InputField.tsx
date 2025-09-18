// project/src/modules/CustomerProducts/Forms/InputField.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import { appTheme } from "@/util/appTheme";
import { useContext, useRef, useState } from "react";
import {
  FieldValues,
  Path,
  UseFormRegister,
  RegisterOptions,
} from "react-hook-form";
import DatePicker from "react-datepicker";
import { IoClose } from "react-icons/io5";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import { useAppContext } from "@/contexts/appContext";

const InputField = <T extends FieldValues>({
  inputType,
  label,
  name,
  inputMode,
  pattern,
  register,
  registerOptions,
  error,
  disabled = false,
  className,
  rows = 3,
  onInput,
  options,
  selected,
  onChange,
  onCancel,
  placeholder,
}: {
  inputType: "input" | "textarea" | "dropdown" | "date";
  label: string;
  name: Path<T>;
  inputMode?: "text" | "numeric" | "decimal";
  pattern?: string;
  register: UseFormRegister<T>;
  registerOptions?: RegisterOptions<T, Path<T>>;
  error?: string;
  disabled?: boolean;
  className?: string;
  rows?: number;
  onInput?: React.InputHTMLAttributes<HTMLInputElement>["onInput"];
  options?: string[];
  selected?: Date | undefined;
  onChange?: (date: Date | null) => void;
  onCancel?: () => void;
  placeholder?: string;
}) => {
  const { currentUser } = useContext(AuthContext);
  const { formatDropdownOption } = useAppContext();

  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const isDatePickerOpenRef = useRef<boolean>(false);

  if (!currentUser) return null;

  return (
    <div
      className={className}
      style={{
        margin: 0, 
        padding: 0,
        position: "relative",
        ["--custom-input-text-color" as any]:
          appTheme[currentUser.theme].text_1,
      }}
    >
      {/* <label className="block font-[400]">{label}</label> */}
      {inputType === "input" ? (
        <input
          {...register(name, registerOptions)}
          type={"text"}
          inputMode={inputMode}
          pattern={pattern}
          onInput={onInput}
          disabled={disabled}
          placeholder={
            placeholder ? placeholder : capitalizeFirstLetter(name) + "..."
          }
          className="truncate outline-none border-none input w-[100%]"
        />
      ) : inputType === "textarea" ? (
        <textarea
          {...register(name)}
          className="outline-none p-0 m-0 border-none resize-none input rounded-[7px] w-[100%] px-[12px] py-[6px]"
          disabled={disabled}
          placeholder={
            placeholder ? placeholder : capitalizeFirstLetter(name) + "..."
          }
          style={{
            backgroundColor: appTheme[currentUser.theme].background_2,
          }}
          rows={rows}
        />
      ) : inputType === "dropdown" ? (
        <div className="relative">
          <select
            {...register(name)}
            className="input rounded-[7px] w-full px-3 py-[4px] custom-select pr-8 cursor-pointer"
            style={{
              appearance: "none",
              WebkitAppearance: "none",
              color: appTheme[currentUser.theme].text_1,
            }}
          >
            {options &&
              options.map((option) => (
                <option key={option} value={option}>
                  {formatDropdownOption(option)}
                </option>
              ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              fill={appTheme[currentUser.theme].text_1}
              viewBox="0 0 20 20"
            >
              <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
            </svg>
          </div>
        </div>
      ) : inputType === "date" ? (
        <div className="flex items-center flex-row gap-[10px] h-[100%]">
          {onChange && (
            <div className="w-[100px]">
              <DatePicker
                selected={selected}
                onChange={(date) => {
                  onChange(date);
                }}
                onCalendarOpen={() => {
                  setIsDatePickerOpen(true);
                  isDatePickerOpenRef.current = true;
                }}
                onCalendarClose={() => {
                  setIsDatePickerOpen(false);
                  isDatePickerOpenRef.current = false;
                }}
                customInput={
                  <div className="w-full h-full opacity-40 cursor-pointer hover:brightness-75 dim">
                    {selected ? selected.toLocaleDateString() : "Select Date"}
                  </div>
                }
              />
            </div>
          )}

          {onCancel && selected && name === "date_complete" && (
            <div
              onMouseDown={(e) => {
                if (isDatePickerOpenRef.current) {
                  onCancel();
                }
              }}
              style={{
                backgroundColor: appTheme[currentUser.theme].background_3,
                opacity: isDatePickerOpen ? 1 : 0,
              }}
              className={`ml-[-10px] mt-[1px] flex items-center justify-center w-[25px] h-[25px] pb-[0.5px] pr-[0.5px] rounded-[4px] ${
                isDatePickerOpen && "cursor-pointer dim hover:brightness-90"
              }`}
            >
              <IoClose color={appTheme[currentUser.theme].text_4} size={21} />
            </div>
          )}
        </div>
      ) : (
        <></>
      )}
      {error && <p className="text-red-500 text-sm mt-[10px]">{error}</p>}
    </div>
  );
};

export default InputField;
