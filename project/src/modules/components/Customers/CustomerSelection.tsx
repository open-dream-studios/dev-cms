// project/modules/components/Customers/CustomerSelection.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { Customer } from "@open-dream/shared";
import { Product } from "@open-dream/shared";
import { formatPhone } from "@/util/functions/Customers";
import { useContext, useEffect, useMemo, useState } from "react";
import { IoTrashSharp } from "react-icons/io5";
import { useFormInstanceStore } from "@/store/util/formInstanceStore";
import { useCurrentTheme } from "@/hooks/useTheme";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import SearchBar from "../SearchBar";
import {
  determineSearchContext,
  highlightText,
  runSearchMatch,
} from "@/util/functions/Search";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";

const CustomerSelectCard = ({
  customer,
  product,
}: {
  customer: Customer;
  product: Product | null;
}) => {
  const currentTheme = useCurrentTheme();
  const { upsertProducts } = useContextQueries();
  const { searchContext } = useCurrentDataStore();
  const { currentUser } = useContext(AuthContext);
  const { getForm } = useFormInstanceStore();

  const productForm = getForm("product");
  const { modal1, setModal1 } = useUiStore();

  const handleSelectCustomer = async (customer: Customer) => {
    if (productForm) {
      productForm.setValue("customer_id", customer.id, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setModal1({ ...modal1, open: false });
    } else if (product && customer.id) {
      await upsertProducts([
        {
          ...product,
          customer_id: customer.id,
        },
      ]);
      setModal1({ ...modal1, open: false });
    }
  };

  if (!currentUser) return null;

  let display;

  if (!searchContext) {
    display = {
      first: capitalizeFirstLetter(customer.first_name),
      last: capitalizeFirstLetter(customer.last_name),
      email: customer.email ?? "",
      phone: formatPhone(customer.phone ?? ""),
    };
  } else {
    const schema = searchContext.schema(customer);
    const result = runSearchMatch(searchContext.parsed, schema);

    const highlight = (text: string, key: string) =>
      highlightText(text, result.matched[key] ?? [], () => ({
        backgroundColor: "rgba(180,215,255,0.7)",
        color:
          currentUser?.theme === "dark"
            ? currentTheme.background_2
            : currentTheme.text_4,
      }));

    const nameFirst = highlight(
      capitalizeFirstLetter(customer.first_name),
      "first"
    );
    const nameLast = highlight(
      capitalizeFirstLetter(customer.last_name),
      "last"
    );
    const email = highlight(customer.email ?? "", "email");
    const phone = highlight(formatPhone(customer.phone ?? ""), "phone");

    display = {
      first:
        searchContext.type === "name"
          ? nameFirst
          : capitalizeFirstLetter(customer.first_name),
      last:
        searchContext.type === "name"
          ? nameLast
          : capitalizeFirstLetter(customer.last_name),
      email: searchContext.type === "email" ? email : customer.email ?? "",
      phone:
        searchContext.type === "phone"
          ? phone
          : formatPhone(customer.phone ?? ""),
    };
  }

  return (
    <div
      style={{
        backgroundColor: currentTheme.background_3,
      }}
      onClick={() => handleSelectCustomer(customer)}
      className="cursor-pointer hover:brightness-[86%] dim px-[18px] py-[5px] w-[100%] min-h-[60px] rounded-[12px] flex flex-row items-center"
    >
      <div className="w-[100%] h-[100%] items-center flex flex-row gap-[10px]">
        <div
          className="w-[38px] h-[38px] flex items-center justify-center rounded-full border font-semibold text-[13px] min-w-[38px] min-h-[38px]"
          style={{
            borderColor: currentTheme.text_3,
            color: currentTheme.text_3,
          }}
        >
          {`${customer.first_name?.[0] ?? ""}${
            customer.last_name?.[0] ?? ""
          }`.toUpperCase()}
        </div>
        <div className="flex h-[100%] w-[100%] flex-col justify-center">
          <div className="flex flex-row justify-between w-[100%]">
            <div className="font-[600] text-[17px] leading-[19px]">
              {display.first} {display.last}
            </div>
            {customer.email && (
              <div
                style={{ color: currentTheme.text_4 }}
                className="font-[500] text-[14px]"
              >
                {display.email}
              </div>
            )}
          </div>

          <div className="flex flex-row justify-between w-[100%]">
            {customer.city && customer.state && (
              <div
                style={{ color: currentTheme.text_4 }}
                className="font-[500] text-[14px]"
              >{`${customer.city}, ${customer.state}`}</div>
            )}
            {customer.phone && (
              <div
                style={{ color: currentTheme.text_4 }}
                className="font-[500] text-[14px]"
              >
                {display.phone}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
const CustomerSelection = ({ product }: { product: Product | null }) => {
  const { currentUser } = useContext(AuthContext);
  const { customers } = useContextQueries();
  const { getForm } = useFormInstanceStore();
  const currentTheme = useCurrentTheme();
  const { searchContext, setSearchContext, currentCustomerSearchTerm } =
    useCurrentDataStore();

  const [initialCustomerId, setInitialCustomerId] = useState<number | null>(
    null
  );

  const productForm = getForm("product");

  const { modal1, setModal1 } = useUiStore();

  useEffect(() => {
    if (modal1.open && productForm) {
      const currentId = productForm.getValues("customer_id");
      setInitialCustomerId(currentId ?? null);
    }
  }, [modal1.open, productForm]);

  useEffect(() => {
    if (!currentCustomerSearchTerm.trim()) {
      setSearchContext(null);
      return;
    }
    if (!customers.length) return;
    const ctx = determineSearchContext(
      currentCustomerSearchTerm.trim(),
      customers
    );

    setSearchContext(ctx);
  }, [currentCustomerSearchTerm, customers, setSearchContext]);

  const handleRemoveCustomer = () => {
    if (productForm) {
      productForm.setValue("customer_id", null, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setModal1({ ...modal1, open: false });
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!currentCustomerSearchTerm.trim() || !searchContext) return customers;
    const ctx = searchContext;
    const parsed = ctx.parsed;
    const filtered = customers.filter((customer) => {
      const schema = ctx.schema(customer);
      const result = runSearchMatch(parsed, schema);
      return result.isMatch;
    });
    return filtered;
  }, [customers, searchContext, currentCustomerSearchTerm]);

  if (!currentUser) return null;

  const shouldShowRemove = !!initialCustomerId;

  return (
    <div className="w-[100%] h-[100%] pl-[50px] lg:pl-[80px] pr-[25px] lg:pr-[55px] pt-[40px] flex flex-col gap-[12px]">
      <div className="flex flex-row justify-between w-[100%] pr-[25px] items-center">
        <div className="flex flex-row gap-[13px] flex-1">
          <div className="text-[25px] md:text-[31px] font-[600]  whitespace-nowrap">
            Customer Catalog
          </div>
          <div className="mt-[10px] w-[280px] h-[33px]">
            <SearchBar />
          </div>
        </div>
        {shouldShowRemove && (
          <div
            style={{
              backgroundColor: currentTheme.background_3,
            }}
            onClick={handleRemoveCustomer}
            className="w-auto flex flex-row gap-[7px] px-[16px] h-[37px] rounded-full cursor-pointer hover:brightness-75 dim items-center justify-center"
          >
            <p
              className="font-bold text-[15px]"
              style={{
                color: currentTheme.text_3,
              }}
            >
              Remove
            </p>
            <IoTrashSharp className="w-[19px] h-[19px] opacity-60" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-[10px] pr-[25px] flex-1 overflow-auto pb-[30px]">
        {filteredCustomers.length ? (
          filteredCustomers.map((customer: Customer, index: number) => {
            return (
              <CustomerSelectCard
                key={index}
                customer={customer}
                product={product}
              />
            );
          })
        ) : (
          <div className="mt-[3px] ml-[7px] opacity-[0.4] font-[300] text-[16px]">
            No Matching Customers
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerSelection;
