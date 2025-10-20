import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useUiStore } from "@/store/useUIStore";
import { useModal1Store } from "@/store/useModalStore";
import { Customer } from "@/types/customers";
import { Product } from "@/types/products";
import { appTheme } from "@/util/appTheme";
import { formatPhone } from "@/util/functions/Customers";
import { useContext } from "react";
import { IoTrashSharp } from "react-icons/io5";

const CustomerSelection = ({ product }: { product: Product | null }) => {
  const { currentUser } = useContext(AuthContext);
  const { customers, upsertProducts, refetchProductsData } =
    useContextQueries();
  const { screen } = useUiStore()
 
  const modal1 = useModal1Store((state: any) => state.modal1);
  const setModal1 = useModal1Store((state: any) => state.setModal1);

  const handleSelectCustomer = async (customer: Customer) => {
    // if (productFormRef.current) {
    //   productFormRef.current.setValue("customer_id", customer.id, {
    //     shouldDirty: true,
    //     shouldValidate: true,
    //   });
    //   setModal1({ ...modal1, open: false });
    // }

    if (screen === "customer-products") {
      console.log("updating...");
      // await upsertProducts([
      //   {
      //     ...product,
      //     customer_id: customer.id,
      //   } as Product,
      // ]);

      setModal1({
        ...modal1,
        open: false,
      });
      await refetchProductsData();
    }
  };

  const handleRemoveCustomer = () => {
    // if (productFormRef.current) {
    //   productFormRef.current.setValue("customer_id", null, {
    //     shouldDirty: true,
    //     shouldValidate: true,
    //   });
    //   setModal1({ ...modal1, open: false });
    // }
  };

  if (!currentUser || !product) return null;

  return (
    <div className="w-[100%] h-[100%] pl-[50px] lg:pl-[80px] pr-[25px] lg:pr-[55px] pt-[40px] flex flex-col gap-[12px]">
      <div className="flex flex-row justify-between w-[100%] pr-[25px] items-center">
        <div className="text-[25px] md:text-[31px] font-[600]">
          Customer Catalog
        </div>
        <div
          style={{
            backgroundColor: appTheme[currentUser.theme].background_3,
          }}
          onClick={handleRemoveCustomer}
          className="w-[40px] h-[40px] rounded-full cursor-pointer hover:brightness-75 dim flex items-center justify-center"
        >
          <IoTrashSharp className="w-[20px] h-[20px] opacity-60" />
        </div>
      </div>
      <div className="flex flex-col gap-[10px] pr-[25px] flex-1 overflow-auto pb-[30px]">
        {customers.map((customer: Customer, index: number) => {
          return (
            <div
              key={index}
              style={{
                backgroundColor: appTheme[currentUser.theme].background_3,
              }}
              onClick={() => handleSelectCustomer(customer)}
              className="cursor-pointer hover:brightness-[86%] dim px-[18px] py-[5px] w-[100%] min-h-[60px] rounded-[12px] flex flex-row items-center"
            >
              <div className="w-[100%] h-[100%] items-center flex flex-row gap-[10px]">
                <div
                  className="w-[38px] h-[38px] flex items-center justify-center rounded-full border font-semibold text-[13px] min-w-[38px] min-h-[38px]"
                  style={{
                    borderColor: appTheme[currentUser.theme].text_3,
                    color: appTheme[currentUser.theme].text_3,
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
              {/* <div>{`${customer.first_name} ${customer.last_name}`}</div>
              <div>Location</div> */}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CustomerSelection;
