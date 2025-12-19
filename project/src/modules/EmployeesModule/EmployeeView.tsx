// project/src/modules/EmployeesModule/EmployeeView.tsx
"use client";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Home,
  Check,
  X,
} from "lucide-react";
import { AuthContext } from "@/contexts/authContext";
import { getInnerCardStyle } from "@/styles/themeStyles";
import {
  EmployeeFormData,
  employeeToForm,
} from "@/util/schemas/employeeSchema";
import {
  formatPhone,
  parseAddressComponents,
} from "@/util/functions/Customers";
import { v4 as uuidv4 } from "uuid";
import { Controller } from "react-hook-form";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { useEmployeeForm } from "@/hooks/forms/useEmployeeForm";
import { useFormInstanceStore } from "@/store/util/formInstanceStore";
import { useOutsideClick } from "@/hooks/util/useOutsideClick";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { onEmployeeFormSubmit } from "./_actions/employees.actions";
import { useQueryClient } from "@tanstack/react-query";
import { targetNextRefOnEnter } from "@/util/functions/Forms";

const EmployeeCard = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { runModule } = useContextQueries();
  const { currentEmployee, currentProjectId, currentProject } =
    useCurrentDataStore();
  const { addingEmployee, leftBarOpen } = useUiStore();
  const employeeForm = useEmployeeForm(currentEmployee);
  const { registerForm, unregisterForm } = useFormInstanceStore();
  const { handleSubmit } = employeeForm;

  const [popupVisible, setPopupVisible] = useState<boolean>(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [sessionToken] = useState(uuidv4());

  const firstNameRef = useRef<HTMLInputElement | null>(null);
  const lastNameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const positionRef = useRef<HTMLInputElement | null>(null);
  const departmentRef = useRef<HTMLInputElement | null>(null);
  const addressLine1Ref = useRef<HTMLInputElement | null>(null);
  const addressLine2Ref = useRef<HTMLInputElement | null>(null);
  const cityRef = useRef<HTMLInputElement | null>(null);
  const stateRef = useRef<HTMLInputElement | null>(null);
  const zipRef = useRef<HTMLInputElement | null>(null);
  const notesRef = useRef<HTMLTextAreaElement | null>(null);

  const popupRef = useRef<HTMLDivElement | null>(null);
  const addressContainerRef = useRef<HTMLDivElement | null>(null);
  const addressInputRef = useRef("");

  useEffect(() => {
    const formKey = "employee";
    registerForm(formKey, employeeForm);
    return () => unregisterForm(formKey);
  }, [employeeForm, registerForm, unregisterForm]);

  useEffect(() => {
    if (currentEmployee) {
      employeeForm.reset(employeeToForm(currentEmployee), {
        keepValues: false,
      });
    } else {
      employeeForm.reset({}, { keepValues: false });
    }
  }, [currentEmployee, employeeForm]);

  useEffect(() => {
    if (addingEmployee) {
      firstNameRef.current?.focus();
    }
  }, [addingEmployee]);

  useOutsideClick(popupRef, () => setPopupVisible(false));
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const latestAddressValue = addressInputRef.current;
      if (!latestAddressValue || latestAddressValue.length < 2) {
        setPredictions([]);
        setPopupVisible(false);
        return;
      }
      try {
        if (currentProject) {
          const res = await runModule("google-maps-api-module", {
            requestType: "predictions",
            sessionToken,
            address: latestAddressValue,
          });
          if (res.ok && res.data && res.data.predictions) {
            setPredictions(res.data.predictions || []);
            setPopupVisible(true);
          }
        }
      } catch (err) {
        console.error("Address suggestions failed", err);
      }
    }, 650);
  };

  const handleAddressChange = (val: string) => {
    addressInputRef.current = val;
    startTimer();
  };

  const handleSelectAddress = async (prediction: any) => {
    try {
      if (currentProject) {
        const res = await runModule("google-maps-api-module", {
          requestType: "place",
          sessionToken,
          place_id: prediction.place_id ?? undefined,
        });
        if (res.ok && res.data && res.data.result) {
          const { address_components } = res.data.result;
          const parsed = parseAddressComponents(address_components);

          employeeForm.setValue("address_line1", parsed.address_line1, {
            shouldValidate: true,
            shouldDirty: true,
          });
          employeeForm.setValue("address_line2", parsed.address_line2, {
            shouldValidate: true,
            shouldDirty: true,
          });
          employeeForm.setValue("city", parsed.city, { shouldDirty: true });
          employeeForm.setValue("state", parsed.state, { shouldDirty: true });
          employeeForm.setValue("zip", parsed.zip, { shouldDirty: true });
        }
      }
      setPopupVisible(false);
    } catch (err) {
      console.error("Address suggestions failed", err);
    }
  };

  if (!currentUser || !currentProjectId) return null;

  return (
    <form
      onSubmit={handleSubmit(onEmployeeFormSubmit)}
      className="rounded-xl relative w-full max-w-[900px]"
      key={currentUser.theme}
      style={{
        ...getInnerCardStyle(currentUser.theme, currentTheme),
        transform: "translateZ(0)",
      }}
    >
      <div
        className={`p-4 w-full max-w-[720px] pr-[35px] md:pr-[60px] ${
          leftBarOpen ? "min-[1024px]:pr-[38px]" : ""
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(6,182,212,0.18)" }}
            aria-hidden
          >
            <User size={20} className="opacity-95" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[24px] leading-[28px] font-semibold truncate">
                  {currentEmployee &&
                    `${currentEmployee.first_name} ${currentEmployee.last_name}`}
                </div>
                <div className="text-[15.5px] opacity-70 truncate mt-[1.8px]">
                  {currentEmployee &&
                    currentEmployee.position &&
                    `${currentEmployee.position}`}
                </div>
              </div>
            </div>

            <div
              className={`mt-4 grid gap-3 ${
                leftBarOpen ? "grid-cols-1" : "grid-cols-1"
              } sm:grid-cols-2`}
            >
              <div className="flex flex-col gap-2">
                <label className="text-[12px] opacity-70 font-medium">
                  First Name
                </label>
                <div
                  className="rounded-md px-3 py-2 flex items-center gap-3"
                  style={{ background: currentTheme.background_2 }}
                >
                  <User size={16} className="opacity-50 min-w-[16px]" />
                  <input
                    {...employeeForm.register("first_name")}
                    ref={(el) => {
                      employeeForm.register("first_name").ref(el);
                      firstNameRef.current = el;
                    }}
                    onKeyDown={targetNextRefOnEnter(lastNameRef)}
                    placeholder="First"
                    size={Math.max(
                      employeeForm.watch("first_name")?.length || 0,
                      4
                    )}
                    className="flex-1 bg-transparent outline-none text-[14px] placeholder:opacity-60 w-[100%] truncate"
                    onChange={(e) => {
                      let value = e.target.value
                        .replace(/[^A-Za-z-]/g, "") // allow only letters + dashes
                        .replace(/\s+/g, ""); // remove spaces
                      value =
                        value.charAt(0).toUpperCase() +
                        value.slice(1).toLowerCase();
                      employeeForm.setValue("first_name", value, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] opacity-70 font-medium">
                  Last Name
                </label>
                <div
                  className="rounded-md px-3 py-2 flex items-center gap-3"
                  style={{ background: currentTheme.background_2 }}
                >
                  <User size={16} className="opacity-50 min-w-[16px]" />
                  <input
                    {...employeeForm.register("last_name")}
                    ref={(el) => {
                      employeeForm.register("last_name").ref(el);
                      lastNameRef.current = el;
                    }}
                    onKeyDown={targetNextRefOnEnter(emailRef)}
                    placeholder="Last"
                    size={Math.max(
                      employeeForm.watch("last_name")?.length || 0,
                      4
                    )}
                    className="flex-1 bg-transparent outline-none text-[14px] placeholder:opacity-60 w-[100%] truncate"
                    onChange={(e) => {
                      let value = e.target.value
                        .replace(/[^A-Za-z-]/g, "") // allow only letters + dashes
                        .replace(/\s+/g, ""); // remove spaces
                      value =
                        value.charAt(0).toUpperCase() +
                        value.slice(1).toLowerCase();
                      employeeForm.setValue("last_name", value, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] opacity-70 font-medium">
                  Email
                </label>
                <div
                  className="rounded-md px-3 py-2 flex items-center gap-3"
                  style={{ background: currentTheme.background_2 }}
                >
                  <Mail size={16} className="opacity-50 min-w-[16px]" />
                  <input
                    {...employeeForm.register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email address",
                      },
                    })}
                    ref={(el) => {
                      employeeForm.register("email").ref(el);
                      emailRef.current = el;
                    }}
                    onKeyDown={targetNextRefOnEnter(phoneRef)}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/[^a-z0-9.@-]/gi, "") // allow only alphanumeric + . @ -
                        .replace(/\s+/g, "") // remove spaces
                        .toLowerCase(); // force lowercase
                      employeeForm.setValue("email", value, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    placeholder="Email"
                    className="flex-1 bg-transparent outline-none text-[14px] placeholder:opacity-60 w-[100%] truncate"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] opacity-70 font-medium">
                  Phone
                </label>
                <div
                  className="rounded-md px-3 py-2 flex items-center gap-3"
                  style={{ background: currentTheme.background_2 }}
                >
                  <Phone size={16} className="opacity-50 min-w-[16px]" />
                  <Controller
                    control={employeeForm.control}
                    name="phone"
                    rules={{
                      required: "Phone is required",
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: "Enter a valid 10-digit phone number",
                      },
                    }}
                    render={({ field }) => (
                      <input
                        ref={phoneRef}
                        value={formatPhone(field.value || "")}
                        onKeyDown={targetNextRefOnEnter(positionRef)}
                        onChange={(e) => {
                          let raw = e.target.value.replace(/\D/g, "");
                          if (raw.length > 10) raw = raw.slice(0, 10);
                          field.onChange(raw);
                        }}
                        placeholder="Phone"
                        className="flex-1 bg-transparent outline-none text-[14px] placeholder:opacity-60 w-[100%] truncate"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] opacity-70 font-medium">
                  Job Title
                </label>
                <div
                  className="rounded-md px-3 py-2 flex items-center gap-3"
                  style={{ background: currentTheme.background_2 }}
                >
                  <Briefcase size={16} className="opacity-50 min-w-[16px]" />
                  <input
                    {...employeeForm.register("position")}
                    ref={(el) => {
                      employeeForm.register("position").ref(el);
                      positionRef.current = el;
                    }}
                    onKeyDown={targetNextRefOnEnter(departmentRef)}
                    placeholder="Title"
                    size={Math.max(
                      employeeForm.watch("position")?.length || 0,
                      4
                    )}
                    className="flex-1 bg-transparent outline-none text-[14px] placeholder:opacity-60 w-[100%] truncate"
                    onChange={(e) => {
                      let value = e.target.value;
                      value = value.charAt(0).toUpperCase() + value.slice(1);
                      employeeForm.setValue("position", value, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] opacity-70 font-medium">
                  Department
                </label>
                <div
                  className="rounded-md px-3 py-2 flex items-center gap-3"
                  style={{ background: currentTheme.background_2 }}
                >
                  <Home size={16} className="opacity-50 min-w-[16px]" />
                  <input
                    {...employeeForm.register("department")}
                    ref={(el) => {
                      employeeForm.register("department").ref(el);
                      departmentRef.current = el;
                    }}
                    onKeyDown={targetNextRefOnEnter(addressLine1Ref)}
                    placeholder="Department"
                    size={Math.max(
                      employeeForm.watch("department")?.length || 0,
                      4
                    )}
                    className="flex-1 bg-transparent outline-none text-[14px] placeholder:opacity-60 w-[100%] truncate"
                    onChange={(e) => {
                      let value = e.target.value;
                      value = value.charAt(0).toUpperCase() + value.slice(1);
                      employeeForm.setValue("department", value, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[12px] opacity-70 font-medium">
                  Address
                </label>
                <div ref={addressContainerRef} className="relative mt-[7px]">
                  <div
                    className="rounded-md w-[100%] px-3 py-2 flex items-center gap-3"
                    style={{ background: currentTheme.background_2 }}
                  >
                    <MapPin size={16} className="opacity-50" />
                    <input
                      {...employeeForm.register("address_line1")}
                      ref={(el) => {
                        employeeForm.register("address_line1").ref(el);
                        addressLine1Ref.current = el;
                      }}
                      onKeyDown={targetNextRefOnEnter(addressLine2Ref)}
                      placeholder="Street Address"
                      size={Math.max(
                        employeeForm.watch("address_line1")?.length || 0,
                        4
                      )}
                      className="flex-1 bg-transparent outline-none text-[14px] placeholder:opacity-60 w-[100%] truncate"
                      onChange={(e) => {
                        let value = e.target.value;
                        value = value.charAt(0).toUpperCase() + value.slice(1);
                        employeeForm.setValue("address_line1", value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        handleAddressChange(e.target.value);
                      }}
                    />
                  </div>

                  {popupVisible && predictions.length > 0 && (
                    <div
                      ref={popupRef}
                      className="absolute left-0 right-0 mt-1 rounded-md shadow-lg overflow-hidden z-50"
                      style={{
                        background: currentTheme.background_2,
                        border: "1px solid rgba(0,0,0,0.06)",
                      }}
                    >
                      {predictions.slice(0, 6).map((p: any, i: number) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSelectAddress(p)}
                          className="hover:brightness-[65%] dim cursor-pointer w-full text-left px-3 py-2"
                          style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                          }}
                        >
                          <MapPin size={16} className="opacity-60" />
                          <div className="truncate text-[14px]">
                            <div className="font-medium truncate">
                              {p.structured_formatting?.main_text}
                            </div>
                            <div className="text-[12px] opacity-60 truncate">
                              {p.structured_formatting?.secondary_text}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className="mt-[15px] w-[100%] rounded-md px-3 py-2 flex items-center gap-3"
                  style={{ background: currentTheme.background_2 }}
                >
                  <input
                    {...employeeForm.register("address_line2")}
                    ref={(el) => {
                      employeeForm.register("address_line2").ref(el);
                      addressLine2Ref.current = el;
                    }}
                    onKeyDown={targetNextRefOnEnter(cityRef)}
                    placeholder="Apt, Suite"
                    size={Math.max(
                      employeeForm.watch("address_line2")?.length || 0,
                      4
                    )}
                    className="flex-1 bg-transparent outline-none text-[14px] placeholder:opacity-60 w-[100%] truncate"
                    onChange={(e) => {
                      let value = e.target.value;
                      value = value.charAt(0).toUpperCase() + value.slice(1);
                      employeeForm.setValue("address_line2", value, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </div>

                <div className="mt-[15px] grid grid-cols-3 sm:grid-cols-8 gap-[15px] w-[100%]">
                  <div
                    className="col-span-3 rounded-md px-3 py-2 flex items-center gap-3"
                    style={{ background: currentTheme.background_2 }}
                  >
                    <input
                      {...employeeForm.register("city")}
                      ref={(el) => {
                        employeeForm.register("city").ref(el);
                        cityRef.current = el;
                      }}
                      onKeyDown={targetNextRefOnEnter(stateRef)}
                      placeholder="City"
                      size={Math.max(
                        employeeForm.watch("city")?.length || 0,
                        4
                      )}
                      className="flex-1 bg-transparent outline-none text-[14px] placeholder:opacity-60 w-[100%] truncate"
                      onChange={(e) => {
                        let value = e.target.value.replace(
                          /[^A-Za-z0-9-]/g,
                          ""
                        ); // allow only letters + numbers + dashes
                        value = value.charAt(0).toUpperCase() + value.slice(1);
                        employeeForm.setValue("city", value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                  </div>

                  <div
                    className="col-span-3 rounded-md px-3 py-2 flex items-center gap-3"
                    style={{ background: currentTheme.background_2 }}
                  >
                    <input
                      {...employeeForm.register("state")}
                      ref={(el) => {
                        employeeForm.register("state").ref(el);
                        stateRef.current = el;
                      }}
                      onKeyDown={targetNextRefOnEnter(zipRef)}
                      placeholder="State"
                      size={Math.max(
                        employeeForm.watch("state")?.length || 0,
                        4
                      )}
                      className="flex-1 bg-transparent outline-none text-[14px] placeholder:opacity-60 w-[100%] truncate"
                      onChange={(e) => {
                        let value = e.target.value.replace(
                          /[^A-Za-z0-9-]/g,
                          ""
                        ); // allow only letters + numbers + dashes
                        value = value.charAt(0).toUpperCase() + value.slice(1);
                        employeeForm.setValue("state", value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                  </div>

                  <div
                    className="col-span-3 sm:col-span-2 rounded-md px-3 py-2 flex items-center gap-3"
                    style={{ background: currentTheme.background_2 }}
                  >
                    <input
                      {...employeeForm.register("zip")}
                      ref={(el) => {
                        employeeForm.register("zip").ref(el);
                        zipRef.current = el;
                      }}
                      onKeyDown={targetNextRefOnEnter(notesRef)}
                      placeholder="Zip"
                      size={Math.max(employeeForm.watch("zip")?.length || 0, 4)}
                      className="flex-1 bg-transparent outline-none text-[14px] placeholder:opacity-60 w-[100%] truncate"
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/[^0-9-]/g, "") // allow only letters + dashes
                          .replace(/\s+/g, ""); // remove spaces
                        employeeForm.setValue("zip", value, {
                          shouldValidate: true,
                        });
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 mt-1">
                <label className="text-[12px] opacity-70 font-medium">
                  Notes
                </label>
                <div
                  className="mt-[7px] rounded-md px-3 py-2"
                  style={{ background: currentTheme.background_2 }}
                >
                  <textarea
                    {...employeeForm.register("notes")}
                    ref={(el) => {
                      employeeForm.register("notes").ref(el);
                      notesRef.current = el;
                    }}
                    placeholder="Notes..."
                    rows={3}
                    className="w-full bg-transparent outline-none resize-none text-[14px] placeholder:opacity-60"
                    onChange={(e) => {
                      const value = e.target.value;
                      employeeForm.setValue("notes", value, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-[25px] flex items-center gap-3 mb-[25px]">
              {employeeForm.formState.isDirty &&
                employeeForm.formState.isValid && (
                  <button
                    type="submit"
                    className={`hover:brightness-74 dim cursor-pointer transition inline-flex items-center gap-2 pl-8 pr-[39px] py-2.5 rounded-[10px] font-medium`}
                    style={{
                      backgroundColor: `${currentTheme.app_color_1}`,
                      color: currentTheme.text_1,
                    }}
                  >
                    <Check size={20} />
                    <span className="text-[16px] font-medium">Save</span>
                  </button>
                )}

              {employeeForm.formState.isDirty && (
                <button
                  type="button"
                  className={`hover:brightness-[88%] dim cursor-pointer transition inline-flex items-center gap-2 pl-[32px] pr-[39px] py-[10px] rounded-[10px] font-medium`}
                  style={{
                    backgroundColor: currentTheme.background_2,
                    color: currentTheme.text_2,
                  }}
                  onClick={() => {
                    if (currentEmployee) {
                      employeeForm.reset(currentEmployee as EmployeeFormData);
                    } else {
                      employeeForm.reset(employeeToForm(null));
                    }
                  }}
                >
                  <X size={20} />
                  <span className="text-[16px] font-[500]">Cancel</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active,
        textarea:-webkit-autofill,
        textarea:-webkit-autofill:hover,
        textarea:-webkit-autofill:focus,
        textarea:-webkit-autofill:active,
        select:-webkit-autofill,
        select:-webkit-autofill:hover,
        select:-webkit-autofill:focus,
        select:-webkit-autofill:active {
          -webkit-text-fill-color: ${currentTheme.text_4} !important;
          -webkit-box-shadow: 0 0 0px 1000px ${currentTheme.background_2} inset !important;
          box-shadow: 0 0 0px 1000px ${currentTheme.background_2} inset !important;
          transition: background-color 5000s ease-in-out 0s !important;
          caret-color: ${currentTheme.text_4} !important;
        }
      `}</style>
    </form>
  );
};

const EmployeeView = () => {
  return (
    <div className="w-full h-full px-6 pt-5">
      <EmployeeCard />
    </div>
  );
};

export default EmployeeView;
