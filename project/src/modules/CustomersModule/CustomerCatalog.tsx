// project/src/screens/PagesEditor/PagesEditor.tsx
import { useState, useContext, useMemo, useEffect } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useProjectContext } from "@/contexts/projectContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { FaPlus } from "react-icons/fa6";
import { appTheme } from "@/util/appTheme";
import { SubmitHandler } from "react-hook-form";
import Divider from "@/lib/blocks/Divider";
import CustomerView from "./CustomerView";
import { Customer } from "@/types/customers";
import { useCustomerForm } from "@/hooks/useCustomerForm";
import { CustomerFormData } from "@/util/schemas/customerSchema";
import Modal2Continue from "@/modals/Modal2Continue";
import { useModal2Store } from "@/store/useModalStore";
import { ExposedCustomerForm } from "./CustomerView";
import { useAppContext } from "@/contexts/appContext";
import { formatPhone } from "@/util/functions/Customers";

const CustomerCatalog = () => {
  const { currentUser } = useContext(AuthContext);
  const { customers, upsertCustomer, isLoadingCustomers, deleteCustomer } =
    useContextQueries();
  const { currentCustomer, setCurrentCustomerData, currentProjectId } =
    useProjectContext();
  const { onCustomerSubmit } = useAppContext();
  const [addingCustomer, setAddingCustomer] = useState<boolean>(false);

  const modal2 = useModal2Store((state: any) => state.modal2);
  const setModal2 = useModal2Store((state: any) => state.setModal2);

  const handleDeleteCustomer = async () => {
    if (!currentProjectId || !contextMenu || !contextMenu.input) return;
    if (currentCustomer && currentCustomer.id === contextMenu.input.id) {
      setCurrentCustomerData(null);
      setAddingCustomer(true);
    }
    await deleteCustomer({
      project_idx: currentProjectId,
      id: contextMenu.input.id,
    });
  };

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    input: Customer;
  } | null>(null);

  useEffect(() => {
    const handler = () => setContextMenu(null);
    window.addEventListener("click", handler);
    const handler2 = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };
    window.addEventListener("keydown", handler2);
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("keydown", handler2);
    };
  }, []);

  const handleContextMenu = (e: React.MouseEvent, input: Customer) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      input,
    });
  };

  const handleCloseContextMenu = () => setContextMenu(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [customerForm, setCustomerForm] = useState<ExposedCustomerForm | null>(
    null
  );

  const handleAddItemClick = () => {
    setCurrentCustomerData(null);
    setAddingCustomer(true);
  };
  useEffect(() => {
    if (addingCustomer && customerForm) {
      customerForm.focusFirstName?.();
    }
  }, [addingCustomer, customerForm]);

  // useEffect(() => {
  //   if (customerForm) {
  //     const { isDirty, isValid, errors } = customerForm.formState;
  //     console.log({ isDirty, isValid, errors });
  //   }
  // }, [customerForm]);

  const handleSubmit: SubmitHandler<CustomerFormData> = async (data) => {
    await onCustomerSubmit(data)
  };

  // when clicking another customer
  const handleCustomerClick = (customer: Customer) => {
    if (!currentUser) return null;
    if (isFormDirty) {
      setModal2({
        ...modal2,
        open: !modal2.open,
        showClose: false,
        offClickClose: true,
        width: "w-[300px]",
        maxWidth: "max-w-[400px]",
        aspectRatio: "aspect-[5/2]",
        borderRadius: "rounded-[12px] md:rounded-[15px]",
        content: (
          <Modal2Continue
            text={`Save customer info?`}
            onContinue={async () => {
              await customerForm?.handleSubmit(handleSubmit)();
              setCurrentCustomerData(customer);
              setAddingCustomer(false);
            }}
            onNoSave={() => {
              setAddingCustomer(false);
              setCurrentCustomerData(customer);
            }}
            threeOptions={true}
          />
        ),
      });
    } else {
      setAddingCustomer(false);
      setCurrentCustomerData(customer);
    }
  };

  if (!currentUser || !currentProjectId) return null;

  return (
    <div className="flex w-full h-[100%]">
      <div
        className="w-60 h-[100%] flex flex-col px-[15px]"
        style={{
          borderRight: `0.5px solid ${
            appTheme[currentUser.theme].background_2
          }`,
        }}
      >
        {contextMenu && (
          <div
            className="fixed z-50 border shadow-lg rounded-md py-1 w-40 animate-fade-in"
            style={{
              top: contextMenu.y,
              left: contextMenu.x,
              backgroundColor: appTheme[currentUser.theme].background_1_2,
              border: "1px solid" + appTheme[currentUser.theme].background_3,
            }}
            onContextMenu={handleCloseContextMenu}
          >
            <button
              onClick={handleDeleteCustomer}
              className="hover:brightness-50 dim cursor-pointer w-full text-left px-3 py-2 text-sm"
            >
              {`Delete customer`}
            </button>
          </div>
        )}

        <div className="flex flex-row items-center justify-between pt-[12px] pb-[6px]">
          <div className="flex flex-row gap-[13.5px] items-center w-[100%]">
            <p className="w-[100%] font-[600] h-[40px] truncate text-[24px] leading-[30px] mt-[1px]">
              Customers
            </p>
          </div>
          {!addingCustomer && (
            <div
              onClick={handleAddItemClick}
              className="dim cursor-pointer hover:brightness-[85%] min-w-[30px] w-[30px] h-[30px] mt-[-5px] rounded-full flex justify-center items-center"
              style={{
                backgroundColor: appTheme[currentUser.theme].background_1_2,
              }}
            >
              <FaPlus size={12} />
            </div>
          )}
        </div>

        <Divider />
        <>
          {customers.map((customer: Customer, index: number) => {
            return (
              <div
                key={index}
                onContextMenu={(e) => handleContextMenu(e, customer)}
                onClick={() => handleCustomerClick(customer)}
                style={{
                  backgroundColor:
                    currentCustomer && currentCustomer.id === customer.id
                      ? appTheme[currentUser.theme].background_3
                      : appTheme[currentUser.theme].background_2,
                  color: appTheme[currentUser.theme].text_4,
                }}
                className="mb-[9.5px] w-full h-[70px] pl-[14px] pr-[7px] flex flex-row gap-[10px] items-center rounded-[12px] 
             hover:brightness-[85%] transition cursor-pointer shadow-sm"
              >
                <div
                  className="flex items-center justify-center rounded-full border font-semibold text-[13px] min-w-[33px] min-h-[33px]"
                  style={{
                    borderColor: appTheme[currentUser.theme].text_4,
                    color: appTheme[currentUser.theme].text_4,
                  }}
                >
                  {`${customer.first_name?.[0] ?? ""}${
                    customer.last_name?.[0] ?? ""
                  }`.toUpperCase()}
                </div>

                <div className="flex flex-col items-start justify-start overflow-hidden h-[58px] mt-[1px]">
                  <p
                    className="w-[100%] font-bold text-[16px] leading-[19px] truncate"
                    style={{ color: appTheme[currentUser.theme].text_4 }}
                  >
                    {customer.first_name} {customer.last_name}
                  </p>

                  <div className="w-[100%] flex flex-col text-[13px] leading-[22px] opacity-70 truncate">
                    {customer.email && (
                      <p className="truncate">{customer.email}</p>
                    )}
                    {customer.phone && (
                      <p className="truncate">{formatPhone(customer.phone)}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      </div>

      <div className="flex-1">
        {(currentCustomer || addingCustomer) && (
          <CustomerView
            key={currentCustomer?.id ?? "new"}
            onDirtyChange={setIsFormDirty}
            onCustomerSubmit={onCustomerSubmit}
            exposeForm={setCustomerForm}
          />
        )}
      </div>
    </div>
  );
};

export default CustomerCatalog;
