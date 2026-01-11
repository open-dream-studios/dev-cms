// project/modules/_util/Selection/CustomerSelection.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { Customer } from "@open-dream/shared";
import { useContext, useEffect, useMemo } from "react";
import { IoTrashSharp } from "react-icons/io5";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import SearchBar from "../../components/SearchBar";
import {
  determineSearchContext,
  runSearchMatch,
} from "@/util/functions/Search";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { getContactCardSearchDisplay } from "@/modules/_util/Search/_actions/search.actions";

const CustomerSelectCard = ({
  customer,
  onSelect,
}: {
  customer: Customer;
  onSelect: (customer: Customer) => void;
}) => {
  const currentTheme = useCurrentTheme();
  const { currentUser } = useContext(AuthContext);

  if (!currentUser) return null;

  const display = getContactCardSearchDisplay(
    customer,
    currentUser,
    currentTheme
  );

  return (
    <div
      style={{
        backgroundColor: currentTheme.background_3,
      }}
      onClick={() => onSelect(customer)}
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
const CustomerSelection = ({
  onSelect,
  onClear,
  clearable,
}: {
  onSelect: (customer: Customer) => void;
  onClear: () => void;
  clearable: boolean;
}) => {
  const { currentUser } = useContext(AuthContext);
  const { customers } = useContextQueries();
  const currentTheme = useCurrentTheme();
  const { searchContext, setSearchContext, currentCustomerSearchTerm } =
    useCurrentDataStore();

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
        {clearable && (
          <div
            style={{
              backgroundColor: currentTheme.background_3,
            }}
            onClick={onClear}
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
                onSelect={onSelect}
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
