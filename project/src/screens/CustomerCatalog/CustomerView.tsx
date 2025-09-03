import React, { useContext, useEffect } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useProjectContext } from "@/contexts/projectContext";
import { appTheme } from "@/util/appTheme";
import { useCustomerForm } from "@/hooks/useCustomerForm";
import {
  customerToForm,
  CustomerFormData,
} from "@/util/schemas/customerSchema";
import { SubmitHandler } from "react-hook-form";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { CheckCircle2 } from "lucide-react";
import FallbackUserImage from "@/components/blocks/FallbackUserImage";
import { formatPhone } from "@/util/functions/Customers";
import { Controller } from "react-hook-form";

const CustomerView = () => {
  const { currentUser } = useContext(AuthContext);
  const { upsertCustomer } = useContextQueries();
  const { currentCustomer, currentProjectId } = useProjectContext();

  const customerForm = useCustomerForm(currentCustomer);
  const { formState } = customerForm;
  const { isDirty, isValid } = formState;

  useEffect(() => {
    if (currentCustomer) {
      customerForm.reset(customerToForm(currentCustomer), {
        keepValues: false,
      });
    } else {
      customerForm.reset({}, { keepValues: false });
    }
  }, [currentCustomer, customerForm]);

  if (!currentUser || !currentProjectId) return null;

  const onSubmit: SubmitHandler<CustomerFormData> = async (data) => {
    if (!currentProjectId) return;

    await upsertCustomer({
      project_idx: currentProjectId,
      customerId: currentCustomer ? currentCustomer.customer_id : undefined,
      ...data,
      phone: data.phone ? data.phone.replace(/\D/g, "") : null, // clean new value
    });

    customerForm.reset({
      ...data,
      phone: data.phone ? data.phone.replace(/\D/g, "") : "",
    });
  };

  return (
    <div className="flex flex-col items-start w-full min-h-[100%] p-6 overflow-scroll">
      <form
        onSubmit={customerForm.handleSubmit(onSubmit as SubmitHandler<any>)}
        className="h-[331px] aspect-[1.65/1] rounded-[30px] shadow-lg py-[22.5px] px-[28px] flex flex-col gap-4"
        style={{
          backgroundColor: appTheme[currentUser.theme].background_2,
          color: appTheme[currentUser.theme].text_4,
        }}
      >
        <div className="flex flex-row gap-[10px]">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center rounded-full border font-semibold text-xl w-[60px] h-[60px]"
              style={{
                borderColor: appTheme[currentUser.theme].text_4,
                color: appTheme[currentUser.theme].text_4,
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
                  color: appTheme[currentUser.theme].text_2,
                }}
                className="flex flex-row items-center font-bold text-[19px] "
              >
                <input
                  {...customerForm.register("first_name")}
                  placeholder="First"
                  size={Math.max(
                    customerForm.watch("first_name")?.length || 0,
                    4
                  )}
                  className="outline-none border-none"
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
                  size={Math.max(
                    customerForm.watch("last_name")?.length || 0,
                    4
                  )}
                  className="ml-[-2px] outline-none border-none pr-[15px]"
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
                {...customerForm.register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                })}
                onChange={(e) => {
                  let value = e.target.value
                    .replace(/[^A-Za-z0-9-.@]/g, "") // allow only letters + dashes
                    .replace(/\s+/g, ""); // remove spaces
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
                    value={formatPhone(field.value || "")}
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
              backgroundColor: appTheme[currentUser.theme].background_3,
            }}
            className="rounded-[8px] w-[50%] h-[100%] pt-[2px] px-[9px]"
          >
            <textarea
              {...customerForm.register("notes")}
              placeholder="Notes"
              className="w-[100%] outline-none border-none rounded p-2 text-sm min-h-[60px] resize-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 flex-1">
          <div className="grid grid-cols-3 gap-3">
            <input
              {...customerForm.register("address_line1")}
              placeholder="Address Line 1"
              className="outline-none border-none rounded p-2 text-sm col-span-3"
            />
            <input
              {...customerForm.register("address_line2")}
              placeholder="Address Line 2"
              className="outline-none border-none rounded p-2 text-sm col-span-3"
            />
            <input
              {...customerForm.register("city")}
              placeholder="City"
              className="outline-none border-none rounded p-2 text-sm"
            />
            <input
              {...customerForm.register("state")}
              placeholder="State"
              className="outline-none border-none rounded p-2 text-sm"
            />
            <input
              {...customerForm.register("zip")}
              placeholder="Zip"
              className="outline-none border-none rounded p-2 text-sm"
            />
          </div>

          {isDirty && isValid && (
            <button
              type="submit"
              className="cursor-pointer hover:brightness-90 dim flex flex-row items-center gap-[7px] mt-[6px] self-start px-4 py-2 rounded-full font-semibold shadow-sm text-sm"
              style={{
                backgroundColor:
                  appTheme[currentUser.theme].background_2_selected,
                color: appTheme[currentUser.theme].text_3,
              }}
            >
              <CheckCircle2 size={20} />{" "}
              <div className="text-[15px]">
                {currentCustomer ? "Save Changes" : "Add Customer"}
              </div>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CustomerView;
