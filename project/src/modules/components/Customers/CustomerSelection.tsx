// project/modules/components/Customers/CustomerSelection.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useModal1Store } from "@/store/useModalStore";
import { Customer } from "@/types/customers";
import { Product } from "@/types/products";
import { appTheme } from "@/util/appTheme";
import { formatPhone } from "@/util/functions/Customers";
import { useContext, useEffect, useState } from "react";
import { IoTrashSharp } from "react-icons/io5";
import { useFormInstanceStore } from "@/store/formInstanceStore";

const CustomerSelection = ({ product }: { product: Product | null }) => {
  const { currentUser } = useContext(AuthContext);
  const { customers, upsertProducts } = useContextQueries();
  const { getForm } = useFormInstanceStore();

  const [initialCustomerId, setInitialCustomerId] = useState<number | null>(
    null
  );

  const theme = currentUser?.theme ?? "dark";
  const t = appTheme[theme];

  const productForm = getForm("product");

  const modal1 = useModal1Store((state: any) => state.modal1);
  const setModal1 = useModal1Store((state: any) => state.setModal1);

  useEffect(() => {
    if (modal1.open && productForm) {
      const currentId = productForm.getValues("customer_id");
      setInitialCustomerId(currentId ?? null);
    }
  }, [modal1.open, productForm]);

  const handleSelectCustomer = async (customer: Customer) => {
    if (productForm) {
      productForm.setValue("customer_id", customer.id, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setModal1({ ...modal1, open: false });
    } else if (product && customer.id) {
      console.log(product, customer.id);
      await upsertProducts([
        {
          ...product,
          customer_id: customer.id,
        },
      ]);
      setModal1({ ...modal1, open: false });
    }
  };

  const handleRemoveCustomer = () => {
    if (productForm) {
      productForm.setValue("customer_id", null, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setModal1({ ...modal1, open: false });
    }
  };

  if (!currentUser) return null;

  const shouldShowRemove = !!initialCustomerId;

  return (
    <div className="w-[100%] h-[100%] pl-[50px] lg:pl-[80px] pr-[25px] lg:pr-[55px] pt-[40px] flex flex-col gap-[12px]">
      <div className="flex flex-row justify-between w-[100%] pr-[25px] items-center">
        <div className="text-[25px] md:text-[31px] font-[600]">
          Customer Catalog
        </div>
        {shouldShowRemove && (
          <div
            style={{
              backgroundColor: t.background_3,
            }}
            onClick={handleRemoveCustomer}
            className="w-auto flex flex-row gap-[7px] px-[16px] h-[37px] rounded-full cursor-pointer hover:brightness-75 dim items-center justify-center"
          >
            <p
              className="font-bold text-[15px]"
              style={{
                color: t.text_3,
              }}
            >
              Remove
            </p>
            <IoTrashSharp className="w-[19px] h-[19px] opacity-60" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-[10px] pr-[25px] flex-1 overflow-auto pb-[30px]">
        {customers.map((customer: Customer, index: number) => {
          return (
            <div
              key={index}
              style={{
                backgroundColor: t.background_3,
              }}
              onClick={() => handleSelectCustomer(customer)}
              className="cursor-pointer hover:brightness-[86%] dim px-[18px] py-[5px] w-[100%] min-h-[60px] rounded-[12px] flex flex-row items-center"
            >
              <div className="w-[100%] h-[100%] items-center flex flex-row gap-[10px]">
                <div
                  className="w-[38px] h-[38px] flex items-center justify-center rounded-full border font-semibold text-[13px] min-w-[38px] min-h-[38px]"
                  style={{
                    borderColor: t.text_3,
                    color: t.text_3,
                  }}
                >
                  {`${customer.first_name?.[0] ?? ""}${
                    customer.last_name?.[0] ?? ""
                  }`.toUpperCase()}
                </div>
                <div className="flex h-[100%] w-[100%] flex-col justify-center">
                  <div className="flex flex-row justify-between w-[100%]">
                    <div className="font-[600] text-[17px] leading-[19px]">{`${customer.first_name} ${customer.last_name}`}</div>
                    {customer.email && (
                      <div className="font-[500] text-[14px] opacity-[0.3]">
                        {customer.email}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-row justify-between w-[100%]">
                    {customer.city && customer.state && (
                      <div className="font-[500] text-[14px] opacity-[0.3]">{`${customer.city}, ${customer.state}`}</div>
                    )}
                    {customer.phone && (
                      <div className="font-[500] text-[14px] opacity-[0.3]">
                        {formatPhone(customer.phone)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CustomerSelection;
