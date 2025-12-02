// project/src/modules/components/ModuleLeftBar.tsx
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import Divider from "@/lib/blocks/Divider";
import { Customer, Product, Employee } from "@open-dream/shared";
import React, { useContext, useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa6";
import CustomerMiniCard from "../CustomersModule/CustomerMiniCard";
import EmployeeMiniCard from "../EmployeesModule/EmployeeMiniCard";
import { employeeToForm } from "@/util/schemas/employeeSchema";
import { customerToForm } from "@/util/schemas/customerSchema";
import { useUiStore } from "@/store/useUIStore";
import { useFormInstanceStore } from "@/store/formInstanceStore";
import { useCustomerFormSubmit } from "@/hooks/forms/useCustomerForm";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useEmployeeFormSubmit } from "@/hooks/forms/useEmployeeForm";
import { useRouting } from "@/hooks/useRouting";
import { useProductFormSubmit } from "@/hooks/forms/useProductForm";
import { productToForm } from "@/util/schemas/productSchema";
import { useCurrentTheme } from "@/hooks/useTheme";
import { GoSync } from "react-icons/go";
import { useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { determineSearchContext, scrollToItem } from "@/util/functions/Search";
import ProductMiniCard from "./ProductCard/ProductMiniCard";
import ProductMiniCardSkeleton from "@/lib/skeletons/ProductMiniCardSkeleton";
import CatalogMiniCardSkeleton from "@/lib/skeletons/CatalogMiniCardSkeleton";

const SearchBar = () => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { currentCustomerSearchTerm, setCurrentCustomerSearchTerm } =
    useCurrentDataStore();

  const inputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = currentCustomerSearchTerm || "";
    }
  }, [currentCustomerSearchTerm]);

  if (!currentUser) return null;

  return (
    <div className="h-[38px] w-[100%] pt-[10px]">
      <div
        className="rounded-[8px] w-[100%] h-[100%] flex items-center px-[10px] flex-row gap-[5px]"
        style={{
          backgroundColor:
            currentUser.theme === "dark"
              ? "rgba(255,255,255,0.028)"
              : currentTheme.background_1_2,
        }}
      >
        <Search
          color={currentTheme.text_3}
          size={15}
          className="opacity-[0.7]"
        />
        <input
          ref={inputRef}
          type="text"
          className="w-[100%] truncate border-none outline-none font-[400] text-[13px] opacity-[0.72]"
          onChange={(e) => {
            setCurrentCustomerSearchTerm(e.target.value);
          }}
        />
      </div>
    </div>
  );
};

const ModuleLeftBar = () => {
  const queryClient = useQueryClient();
  const { setCurrentEmployeeData, setCurrentCustomerData, currentProject } =
    useCurrentDataStore();
  const { currentUser } = useContext(AuthContext);
  const {
    customers,
    deleteCustomer,
    refetchProductsData,
    isLoadingProductsData,
    deleteEmployee,
    employees,
    refetchCustomers,
    runModule,
    isLoadingCustomers,
    isLoadingEmployees,
  } = useContextQueries();
  const {
    localProductsData,
    setCurrentProductData,
    currentProjectId,
    setSearchContext,
  } = useCurrentDataStore();
  const { screenClick } = useRouting();
  const { getForm } = useFormInstanceStore();
  const { setUpdatingLock } = useUiStore();
  const {
    screen,
    setAddingCustomer,
    setAddingEmployee,
    addingProduct,
    setAddingProduct,
  } = useUiStore();
  const { currentCustomerSearchTerm } = useCurrentDataStore();
  const currentTheme = useCurrentTheme();

  const productForm = getForm("product");
  const { onProductFormSubmit } = useProductFormSubmit();

  const customerForm = getForm("customer");
  const { onCustomerFormSubmit } = useCustomerFormSubmit();

  const employeeForm = getForm("employee");
  const { onEmployeeFormSubmit } = useEmployeeFormSubmit();

  const itemRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

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
    if (ctx.bestMatch) {
      scrollToItem(ctx.bestMatch.customer_id, itemRefs, scrollRef, 106);
    }
    setSearchContext(ctx);
  }, [currentCustomerSearchTerm, customers, setSearchContext]);

  const handleDeleteCustomer = async () => {
    if (!contextMenu || !contextMenu.input) return;
    const customerInput = contextMenu.input as Customer;
    if (customerInput.customer_id) {
      await deleteCustomer(customerInput.customer_id);
      if (customerForm) {
        customerForm.reset(customerToForm(null));
      }
      setCurrentCustomerData(null);
      setAddingCustomer(true);
      refetchProductsData();
    }
  };

  const handleDeleteEmployee = async () => {
    if (!contextMenu || !contextMenu.input) return;
    const employeeInput = contextMenu.input as Employee;
    if (employeeInput.employee_id) {
      await deleteEmployee(employeeInput.employee_id);
      if (employeeForm) {
        employeeForm.reset(employeeToForm(null));
      }
      setCurrentEmployeeData(null);
      setAddingEmployee(true);
    }
  };

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    input: Customer | Employee;
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

  const handleContextMenu = (
    e: React.MouseEvent,
    input: Customer | Employee
  ) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      input,
    });
  };

  const handleCloseContextMenu = () => setContextMenu(null);

  const handleCustomerClick = async (customer: Customer | null) => {
    if (customerForm && customerForm.formState.isDirty) {
      await customerForm.handleSubmit(onCustomerFormSubmit)();
    }
    setCurrentCustomerData(customer);
    setAddingCustomer(!customer);
    if (customerForm && !customer) {
      customerForm.reset(customerToForm(null));
    }
  };

  const handleEmployeeClick = async (employee: Employee | null) => {
    if (employeeForm && employeeForm.formState.isDirty) {
      await employeeForm.handleSubmit(onEmployeeFormSubmit)();
    }
    setCurrentEmployeeData(employee);
    setAddingEmployee(!employee);
    if (employeeForm && !employee) {
      employeeForm.reset(employeeToForm(null));
    }
  };

  const handleProductClick = async (product: Product | null) => {
    if (productForm && productForm.formState.isDirty) {
      await productForm.handleSubmit(onProductFormSubmit)();
    }
    if (product) {
      await screenClick(
        "edit-customer-product",
        `/products/${product.serial_number}`
      );
    } else {
      await screenClick("customer-products", `/products`);
    }
    setCurrentProductData(product);
    setAddingProduct(!product);
    if (productForm && !product) {
      productForm.reset(productToForm(null));
    }
  };

  const handlePlusClick = async () => {
    if (screen === "customers") {
      handleCustomerClick(null);
    }
    if (screen === "edit-customer-product") {
      handleProductClick(null);
    }
    if (screen === "employees") {
      handleEmployeeClick(null);
    }
  };

  const handleCustomerSync = async () => {
    setUpdatingLock(true);
    if (currentProject) {
      await runModule("customer-google-wave-sync-module", {});
      refetchCustomers();
      setUpdatingLock(false);
      queryClient.invalidateQueries({
        queryKey: ["customers", currentProjectId],
      });
    }
  };

  if (!currentUser) return null;

  return (
    <div
      className={`${
        screen === "edit-customer-product" ||
        screen === "customers" ||
        screen === "employees" ||
        addingProduct
          ? "hidden md:flex"
          : "hidden"
      } w-[240px] min-w-[240px] h-full flex flex-col min-h-0 overflow-hidden`}
      style={{
        borderRight: `0.5px solid ${currentTheme.background_2}`,
      }}
    >
      <div className="flex flex-col px-[15px] pb-[8px]">
        {contextMenu && screen === "customers" && (
          <div
            className="fixed z-50 border shadow-lg rounded-md py-1 w-40 animate-fade-in"
            style={{
              top: contextMenu.y,
              left: contextMenu.x,
              backgroundColor: currentTheme.background_1_2,
              border: "1px solid" + currentTheme.background_3,
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
        {contextMenu && screen === "employees" && (
          <div
            className="fixed z-50 border shadow-lg rounded-md py-1 w-40 animate-fade-in"
            style={{
              top: contextMenu.y,
              left: contextMenu.x,
              backgroundColor: currentTheme.background_1_2,
              border: "1px solid" + currentTheme.background_3,
            }}
            onContextMenu={handleCloseContextMenu}
          >
            <button
              onClick={handleDeleteEmployee}
              className="hover:brightness-50 dim cursor-pointer w-full text-left px-3 py-2 text-sm"
            >
              {`Delete employee`}
            </button>
          </div>
        )}

        <div className="flex flex-row items-center justify-between pt-[12px] pb-[6px]">
          <div className="select-none flex flex-row gap-[13.5px] items-center w-[100%]">
            <p className="w-[100%] font-[600] h-[40px] truncate text-[24px] leading-[30px] mt-[1px]">
              {screen === "customers" && "Customers"}
              {screen === "employees" && "Employees"}
              {(screen === "edit-customer-product" ||
                screen === "customer-products") &&
                "Products"}
            </p>
          </div>
          <div className="flex flex-row gap-[6px]">
            {screen === "customers" && (
              <div
                onClick={handleCustomerSync}
                className="dim cursor-pointer hover:brightness-[85%] min-w-[30px] w-[30px] h-[30px] mt-[-5px] rounded-full flex justify-center items-center"
                style={{
                  backgroundColor: currentTheme.background_1_2,
                }}
              >
                <GoSync size={12} className="rotate-[50deg]" />
              </div>
            )}

            {(screen === "customers" ||
              screen === "employees" ||
              screen === "customer-products" ||
              screen === "edit-customer-product") && (
              <div
                onClick={handlePlusClick}
                className="dim cursor-pointer hover:brightness-[85%] min-w-[30px] w-[30px] h-[30px] mt-[-5px] rounded-full flex justify-center items-center"
                style={{
                  backgroundColor: currentTheme.background_1_2,
                }}
              >
                <FaPlus size={12} />
              </div>
            )}
          </div>
        </div>
        <Divider />
        {screen === "customers" && <SearchBar />}
      </div>

      <div className="flex-1 min-h-0 h-[100%]" ref={scrollRef}>
        {screen === "customers" && (
          <div className="w-[100%] h-[100%] px-[15px] pb-[20px] flex flex-col overflow-y-auto gap-[9px]">
            {isLoadingCustomers
              ? Array.from({ length: 4 }, (_, index) => {
                  return <CatalogMiniCardSkeleton key={index} />;
                })
              : customers.map((customer: Customer, index: number) => {
                  return (
                    <div
                      key={customer.customer_id}
                      ref={(el) => {
                        itemRefs.current[customer.customer_id] = el;
                      }}
                    >
                      <CustomerMiniCard
                        customer={customer}
                        index={index}
                        handleContextMenu={handleContextMenu}
                        handleCustomerClick={handleCustomerClick}
                      />
                    </div>
                  );
                })}
          </div>
        )}

        {screen === "employees" && (
          <div className="w-[100%] h-[100%] px-[15px] pb-[20px] flex flex-col overflow-y-auto gap-[9px]">
            {isLoadingEmployees
              ? Array.from({ length: 4 }, (_, index) => {
                  return <CatalogMiniCardSkeleton key={index} />;
                })
              : employees.map((employee: Employee, index: number) => {
                  return (
                    <EmployeeMiniCard
                      key={index}
                      employee={employee}
                      index={index}
                      handleContextMenu={handleContextMenu}
                      handleEmployeeClick={handleEmployeeClick}
                    />
                  );
                })}
          </div>
        )}

        {(screen === "edit-customer-product" || addingProduct) && (
          <div className="w-[100%] h-[100%] pb-[20px] flex flex-col overflow-y-auto gap-[9px]">
            {isLoadingProductsData ? (
              <div className="px-[15px] flex flex-col gap-[9px]">
                {Array.from({ length: 4 }, (_, index) => {
                  return <ProductMiniCardSkeleton key={index} />;
                })}
              </div>
            ) : (
              localProductsData.map((product: Product, index: number) => {
                return (
                  <ProductMiniCard
                    key={index}
                    product={product}
                    index={index}
                    handleProductClick={handleProductClick}
                  />
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleLeftBar;
