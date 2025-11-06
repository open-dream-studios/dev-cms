// project/src/modules/CustomersModule/CustomerView.tsx
import React, { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "@/contexts/authContext";
import { customerToForm } from "@/util/schemas/customerSchema";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { CheckCircle2 } from "lucide-react";
import FallbackUserImage from "@/components/blocks/FallbackUserImage";
import {
  formatPhone,
  parseAddressComponents,
} from "@/util/functions/Customers";
import { Controller } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { Product } from "@open-dream/shared";
import CustomerProductFrame from "../components/ProductCard/CustomerProductFrame";
import { getCardStyle } from "@/styles/themeStyles";
import {
  useCustomerForm,
  useCustomerFormSubmit,
} from "@/hooks/forms/useCustomerForm";
import { useFormInstanceStore } from "@/store/formInstanceStore";
import { useUiStore } from "@/store/useUIStore";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import { runFrontendModule } from "../runFrontendModule";
import { useCurrentTheme } from "@/hooks/useTheme";

export const CustomerView = () => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { productsData, moduleDefinitions, projectModules, integrations } =
    useContextQueries();
  const { currentProject, currentCustomer, currentProjectId } =
    useCurrentDataStore();
  const { addingCustomer } = useUiStore();
  const { onCustomerFormSubmit } = useCustomerFormSubmit();
  const customerForm = useCustomerForm(currentCustomer);
  const { registerForm, unregisterForm } = useFormInstanceStore();
  const { handleSubmit } = customerForm;

  const [sessionToken] = useState(uuidv4());
  const [popupVisible, setPopupVisible] = useState(false);
  const [predictions, setPredictions] = useState([]);

  const firstNameInputRef = useRef<HTMLInputElement | null>(null);
  const lastNameInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const addressLine1Ref = useRef<HTMLInputElement | null>(null);

  const popupRef = useRef<HTMLDivElement | null>(null);
  const addressContainerRef = useRef<HTMLDivElement | null>(null);
  const addressInputRef = useRef("");

  useEffect(() => {
    const formKey = "customer";
    registerForm(formKey, customerForm);
    return () => unregisterForm(formKey);
  }, [customerForm, registerForm, unregisterForm]);

  useEffect(() => {
    if (currentCustomer) {
      customerForm.reset(customerToForm(currentCustomer), {
        keepValues: false,
      });
    } else {
      customerForm.reset({}, { keepValues: false });
    }
  }, [currentCustomer, customerForm]);

  useEffect(() => {
    if (addingCustomer) {
      firstNameInputRef.current?.focus();
    }
  }, [addingCustomer]);

  const handleKeyDown =
    (nextRef: React.RefObject<HTMLElement | null>) =>
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | null>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        nextRef.current?.focus();
      }
    };

  const handleSelectAddress = async (prediction: any) => {
    try {
      if (currentProject) {
        const res = await runFrontendModule("google-maps-api-module", {
          moduleDefinitions,
          projectModules,
          integrations,
          currentProject,
          body: {
            requestType: "place",
            sessionToken,
            place_id: prediction.place_id ?? undefined,
          },
        });
        if (res && res.result) {
          const { address_components } = res.result;
          const parsed = parseAddressComponents(address_components);
          customerForm.setValue("address_line1", parsed.address_line1, {
            shouldValidate: true,
            shouldDirty: true,
          });
          customerForm.setValue("address_line2", parsed.address_line2, {
            shouldValidate: true,
            shouldDirty: true,
          });
          customerForm.setValue("city", parsed.city, { shouldDirty: true });
          customerForm.setValue("state", parsed.state, { shouldDirty: true });
          customerForm.setValue("zip", parsed.zip, { shouldDirty: true });
        }
      }
      setPopupVisible(false);
    } catch (err) {
      console.error("Address suggestions failed", err);
    }

    // try {
    // const details = await fetchPlaceDetails(
    //   prediction.place_id,
    //   sessionToken
    // );
    // if (details.status === "OK") {
    // const result = details.result;
    // const { address_components } = result;
    // const parsed = parseAddressComponents(address_components);
    // customerForm.setValue("address_line1", parsed.address_line1, {
    //   shouldValidate: true,
    //   shouldDirty: true,
    // });
    // customerForm.setValue("address_line2", parsed.address_line2, {
    //   shouldValidate: true,
    //   shouldDirty: true,
    // });
    // customerForm.setValue("city", parsed.city, { shouldDirty: true });
    // customerForm.setValue("state", parsed.state, { shouldDirty: true });
    // customerForm.setValue("zip", parsed.zip, { shouldDirty: true });
    // }
    // setPopupVisible(false);
    // } catch (err) {
    //   console.error(err);
    // }
  };

  useOutsideClick(popupRef, () => setPopupVisible(false));
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(async () => {
      const latestAddressValue = addressInputRef.current;
      try {
        if (currentProject) {
          const res = await runFrontendModule("google-maps-api-module", {
            moduleDefinitions,
            projectModules,
            integrations,
            currentProject,
            body: {
              requestType: "predictions",
              sessionToken,
              address: latestAddressValue,
            },
          });
          if (res && res.predictions) {
            setPredictions(res.predictions || []);
            setPopupVisible(true);
          }
        }
      } catch (err) {
        console.error("Address suggestions failed", err);
      }
    }, 800);
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    startTimer();
  };

  if (!currentUser || !currentProjectId) return null;

  return (
    <div className="flex flex-col items-start w-full h-[100%] p-6 overflow-scroll">
      <form
        onSubmit={handleSubmit(onCustomerFormSubmit)}
        className="w-[100%] max-w-[550px] rounded-[30px] shadow-lg py-[22.5px] px-[28px] flex flex-col gap-4"
        style={getCardStyle(currentUser.theme, currentTheme)}
      >
        <div className="flex flex-row gap-[10px]">
          <div className="flex items-center gap-4 pb-[10px]">
            <div
              className="flex items-center justify-center rounded-full border font-semibold text-xl w-[60px] h-[60px]"
              style={{
                borderColor: currentTheme.text_4,
                color: currentTheme.text_4,
              }}
            >
              {currentCustomer ? (
                <div>
                  {`${currentCustomer.first_name?.[0] ?? ""}${
                    currentCustomer.last_name?.[0] ?? ""
                  }`.toUpperCase()}
                </div>
              ) : (
                <div className="brightness-[58%] w-[100%] h-[100%]">
                  <FallbackUserImage />
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <div
                style={{
                  color: currentTheme.text_2,
                }}
                className="flex flex-row items-center font-bold text-[19px] "
              >
                <input
                  {...customerForm.register("first_name")}
                  ref={(el) => {
                    customerForm.register("first_name").ref(el);
                    firstNameInputRef.current = el;
                  }}
                  onKeyDown={handleKeyDown(lastNameInputRef)}
                  placeholder="First"
                  size={Math.max(
                    customerForm.watch("first_name")?.length || 0,
                    4
                  )}
                  className="outline-none border-none min-w-[50px]"
                  onChange={(e) => {
                    let value = e.target.value
                      .replace(/[^A-Za-z-]/g, "") // allow only letters + dashes
                      .replace(/\s+/g, ""); // remove spaces
                    value =
                      value.charAt(0).toUpperCase() +
                      value.slice(1).toLowerCase();
                    customerForm.setValue("first_name", value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />

                <input
                  {...customerForm.register("last_name")}
                  placeholder="Last"
                  ref={(el) => {
                    customerForm.register("last_name").ref(el);
                    lastNameInputRef.current = el;
                  }}
                  onKeyDown={handleKeyDown(emailInputRef)}
                  size={Math.max(
                    customerForm.watch("last_name")?.length || 0,
                    4
                  )}
                  className="outline-none border-none min-w-[80px] ml-[5px]"
                  onChange={(e) => {
                    let value = e.target.value
                      .replace(/[^A-Za-z-]/g, "") // allow only letters + dashes
                      .replace(/\s+/g, ""); // remove spaces
                    value =
                      value.charAt(0).toUpperCase() +
                      value.slice(1).toLowerCase();
                    customerForm.setValue("last_name", value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                    customerForm.clearErrors("email");
                  }}
                />
              </div>

              <input
                style={{
                  color:
                    currentUser.theme === "light"
                      ? currentTheme.text_3
                      : currentTheme.text_4,
                }}
                {...customerForm.register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                })}
                ref={(el) => {
                  customerForm.register("email").ref(el);
                  emailInputRef.current = el;
                }}
                onKeyDown={handleKeyDown(phoneInputRef)}
                onChange={(e) => {
                  const value = e.target.value
                    .replace(/[^a-z0-9.@-]/gi, "") // allow only alphanumeric + . @ -
                    .replace(/\s+/g, "") // remove spaces
                    .toLowerCase(); // force lowercase
                  customerForm.setValue("email", value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  customerForm.clearErrors("email");
                }}
                placeholder="Email"
                size={Math.max(customerForm.watch("email")?.length || 0, 4)}
                className="outline-none border-none pr-[15px]"
              />

              <Controller
                control={customerForm.control}
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
                    ref={phoneInputRef}
                    value={formatPhone(field.value || "")}
                    onKeyDown={handleKeyDown(addressLine1Ref)}
                    onChange={(e) => {
                      let raw = e.target.value.replace(/\D/g, "");
                      if (raw.length > 10) raw = raw.slice(0, 10);
                      field.onChange(raw);
                    }}
                    placeholder="Phone"
                    className="outline-none border-none pr-[15px]"
                  />
                )}
              />
            </div>
          </div>

          <div
            style={{
              backgroundColor: currentTheme.background_2,
            }}
            className="rounded-[8px] w-[50%] h-[100%] px-[9px]"
          >
            <textarea
              {...customerForm.register("notes")}
              placeholder="Notes"
              className="w-[100%] outline-none border-none rounded pt-[9px] px-2 text-sm h-[100%] resize-none"
            />
          </div>
        </div>

        <div className="flex flex-col flex-1 mt-[-10px]">
          <div className="grid grid-cols-9 relative" ref={addressContainerRef}>
            <input
              {...customerForm.register("address_line1")}
              placeholder="Address Line 1"
              className="outline-none border-none rounded p-2 text-[16.5px] font-[500] col-span-9"
              ref={(el) => {
                customerForm.register("address_line1").ref(el);
                addressLine1Ref.current = el;
              }}
              onChange={(e) => {
                const value = e.target.value;
                addressInputRef.current = value;
                customerForm.setValue("address_line1", value, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                resetTimer();
              }}
            />
            {popupVisible && predictions && predictions.length > 0 && (
              <div
                ref={popupRef}
                style={{
                  backgroundColor: currentTheme.background_2_2,
                }}
                className="z-[900] absolute w-[100%] py-[10px] px-[15px] flex flex-col gap-[2px] h-[auto] left-0 top-[33px] rounded-[11px]"
              >
                {predictions
                  .slice(0, 3)
                  .map((prediction: any, index: number) => {
                    return (
                      <div
                        key={index}
                        className="hover:brightness-75 dim cursor-pointer flex flex-col gap-[5px]"
                        onClick={() => handleSelectAddress(prediction)}
                      >
                        {index !== 0 && (
                          <div
                            className="w-[100%] h-[1.5px] rounded-[1px] opacity-[0.3]"
                            style={{
                              backgroundColor: currentTheme.text_4,
                            }}
                          ></div>
                        )}
                        <div>{prediction.description}</div>
                      </div>
                    );
                  })}
              </div>
            )}
            <input
              {...customerForm.register("address_line2")}
              placeholder="Address Line 2"
              className="outline-none border-none rounded p-2 text-[16.5px] font-[500] col-span-9"
            />
            <input
              {...customerForm.register("city")}
              placeholder="City"
              className="outline-none border-none rounded p-2 col-span-4 lg:col-span-4 text-[15px] font-[500]"
            />
            <input
              {...customerForm.register("state")}
              placeholder="State"
              className="outline-none border-none rounded p-2 col-span-5 lg:col-span-3 text-[15px] font-[500]"
            />
            <input
              {...customerForm.register("zip")}
              placeholder="Zip"
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 5);
                customerForm.setValue("zip", value, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
              value={customerForm.watch("zip") || ""}
              className="outline-none border-none rounded p-2 col-span-9 lg:col-span-2 text-[15px] font-[500]"
            />
          </div>

          <button
            type="submit"
            className={`${
              customerForm.formState.isDirty && customerForm.formState.isValid
                ? "flex"
                : "opacity-0 pointer-events-none"
            } cursor-pointer hover:brightness-90 dim flex flex-row items-center gap-[7px] mt-[9px] self-start px-4 py-2 rounded-full font-semibold shadow-sm text-sm`}
            style={{
              backgroundColor: currentTheme.background_2_selected,
              color: currentTheme.text_3,
            }}
          >
            <CheckCircle2 size={20} />{" "}
            <div className="text-[15px]">
              {currentCustomer ? "Save Changes" : "Add Customer"}
            </div>
          </button>
        </div>
      </form>

      {currentCustomer && (
        <div className="flex-1 w-[100%] pt-[30px]">
          <div className="h-[100%] w-[100%] grid grid-cols-3 xl:grid-cols-4 gap-[20px]">
            {productsData
              .filter(
                (product: Product) => product.customer_id === currentCustomer.id
              )
              .map((product: Product, index: number) => {
                return (
                  <div
                    key={index}
                    className="col-span-3 max-w-[600px] hover:brightness-[86%] dim cursor-pointer"
                  >
                    <CustomerProductFrame product={product} index={index} />
                  </div>
                );
              })}
          </div>
        </div>
      )}

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
    </div>
  );
};

export default CustomerView;
