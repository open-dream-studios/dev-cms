"use client";
import { useContext, useEffect, useRef, useState } from "react";
import { appTheme } from "../util/appTheme";
import { AuthContext } from "../contexts/authContext";
import { useModal2Store } from "../store/useModalStore";
import { formatPhone } from "@/util/functions/Customers";

export type StepConfig = {
  name: string;
  placeholder: string;
  initialValue?: string;
  sanitize?: (value: string) => string;
  validate?: (value: string) => true | string;
};

type Modal2MultiStepModalInputProps = {
  steps: StepConfig[];
  onComplete: (values: Record<string, string>) => void;
};

const Modal2MultiStepModalInput: React.FC<Modal2MultiStepModalInputProps> = ({
  steps,
  onComplete,
}) => {
  const modal2 = useModal2Store((state: any) => state.modal2);
  const setModal2 = useModal2Store((state: any) => state.setModal2);
  const { currentUser } = useContext(AuthContext);

  const inputRef = useRef<HTMLInputElement>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [inputs, setInputs] = useState<Record<string, string>>(
    Object.fromEntries(steps.map((s) => [s.name, s.initialValue ?? ""]))
  );
  const [currentInput, setCurrentInput] = useState(
    steps[0]?.initialValue ?? ""
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentInput(inputs[steps[stepIndex].name] ?? "");
    setError(null);
    inputRef.current?.focus();
  }, [stepIndex]);

  if (!currentUser) return null;

  const handleContinue = () => {
    const config = steps[stepIndex];
    const value = (
      config.sanitize ? config.sanitize(currentInput) : currentInput
    ).trim();

    // validate
    if (config.validate) {
      const result = config.validate(value);
      if (result !== true) {
        setError(typeof result === "string" ? result : "Invalid input");
        inputRef.current?.focus();
        return;
      }
    }

    const updated = { ...inputs, [config.name]: value };
    setInputs(updated);
    setError(null);

    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      setModal2({ ...modal2, open: false });
      onComplete(updated);
    }
  };

  const config = steps[stepIndex];

  return (
    <div className="pt-[2px] w-full h-full flex items-center justify-center flex-col gap-[10px]">
      <div
        style={{ color: appTheme[currentUser.theme].text_1 }}
        className="relative w-[250px]"
      >
        <input
          type="text"
          ref={inputRef}
          value={currentInput}
          onChange={(e) => {
            const sanitized = config.sanitize
              ? config.sanitize(e.target.value)
              : e.target.value;
            const display =
              config.name === "phone" ? formatPhone(sanitized) : sanitized;
            setCurrentInput(display);
          }}
          placeholder={config.placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleContinue();
            }
          }}
          style={{
            backgroundColor: appTheme[currentUser.theme].background_2_2,
            color: appTheme[currentUser.theme].text_1,
          }}
          className="rounded-[7px] w-full px-[11px] py-[5px]"
        />
        {error && (
          <div className="absolute top-[7px] right-[16px] text-red-500 text-[14px]">
            {error}
          </div>
        )}
      </div>

      <div className="w-full h-[40px] px-[25px] flex flex-row gap-[10px]">
        <div
          className="select-none dim hover:brightness-75 cursor-pointer flex-1 h-full rounded-[10px] flex items-center justify-center"
          style={{
            color: appTheme[currentUser.theme].text_1,
            backgroundColor: appTheme[currentUser.theme].background_2_2,
          }}
          onClick={() => setModal2({ ...modal2, open: false })}
        >
          Cancel
        </div>

        <div
          className="select-none dim hover:brightness-75 cursor-pointer flex-1 h-full rounded-[10px] flex items-center justify-center"
          style={{
            color: appTheme[currentUser.theme].background_1_2,
            backgroundColor: appTheme[currentUser.theme].text_3,
          }}
          onClick={handleContinue}
        >
          Continue
        </div>
      </div>
    </div>
  );
};

export default Modal2MultiStepModalInput;
