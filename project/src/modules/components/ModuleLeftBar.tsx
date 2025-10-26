// project/src/modules/components/ModuleLeftBar.tsx
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import Divider from "@/lib/blocks/Divider";
import { Customer } from "@/types/customers";
import { appTheme } from "@/util/appTheme";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa6";
import { CustomerMiniCard } from "../CustomersModule/CustomerCatalog";
import { Skeleton } from "@/components/ui/skeleton";
import { MediaLink } from "@/types/media";
import { Product } from "@/types/products";
import { usePathname } from "next/navigation";
import { Employee } from "@/types/employees";
import { EmployeeMiniCard } from "../EmployeesModule/EmployeeCatalog";
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

const ModuleLeftBar = () => {
  const { setCurrentEmployeeData, setCurrentCustomerData } =
    useCurrentDataStore();
  const { currentUser } = useContext(AuthContext);
  const {
    customers,
    deleteCustomer,
    isLoadingProductsData,
    mediaLinks,
    deleteEmployee,
    employees,
  } = useContextQueries();
  const { localProductsData, setCurrentProductData } = useCurrentDataStore();
  const { screenClick } = useRouting();
  const pathname = usePathname();
  const { getForm } = useFormInstanceStore();

  const {
    screen,
    addingCustomer,
    setAddingCustomer,
    addingEmployee,
    setAddingEmployee,
    addingProduct,
    setAddingProduct,
  } = useUiStore();

  const theme = currentUser?.theme ?? "dark";
  const t = appTheme[theme];

  const productForm = getForm("product");
  const { onProductFormSubmit } = useProductFormSubmit();

  const customerForm = getForm("customer");
  const { onCustomerFormSubmit } = useCustomerFormSubmit();

  const employeeForm = getForm("employee");
  const { onEmployeeFormSubmit } = useEmployeeFormSubmit();

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

  const currentProductId = useMemo(() => {
    const dividedPath = pathname.split("/").filter((item) => item.length > 0);
    if (dividedPath.length === 2) {
      return dividedPath[1];
    } else {
      return null;
    }
  }, [pathname]);

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
      } w-[240px] min-w-[240px] h-[100%] flex-col px-[15px] overflow-hidden`}
      style={{
        borderRight: `0.5px solid ${t.background_2}`,
      }}
    >
      {contextMenu && screen === "customers" && (
        <div
          className="fixed z-50 border shadow-lg rounded-md py-1 w-40 animate-fade-in"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: t.background_1_2,
            border: "1px solid" + t.background_3,
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
            backgroundColor: t.background_1_2,
            border: "1px solid" + t.background_3,
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
        {!addingCustomer && !addingEmployee && !addingProduct && (
          <div
            onClick={handlePlusClick}
            className="dim cursor-pointer hover:brightness-[85%] min-w-[30px] w-[30px] h-[30px] mt-[-5px] rounded-full flex justify-center items-center"
            style={{
              backgroundColor: t.background_1_2,
            }}
          >
            <FaPlus size={12} />
          </div>
        )}
      </div>

      <Divider />
      {screen === "customers" && (
        <>
          {customers.map((customer: Customer, index: number) => {
            return (
              <CustomerMiniCard
                customer={customer}
                key={index}
                index={index}
                handleContextMenu={handleContextMenu}
                handleCustomerClick={handleCustomerClick}
              />
            );
          })}
        </>
      )}
      {screen === "employees" && (
        <>
          {employees.map((employee: Employee, index: number) => {
            return (
              <EmployeeMiniCard
                employee={employee}
                key={index}
                index={index}
                handleContextMenu={handleContextMenu}
                handleEmployeeClick={handleEmployeeClick}
              />
            );
          })}
        </>
      )}
      {(screen === "edit-customer-product" || addingProduct) && (
        <div className="flex w-[100%] h-[100%] overflow-y-auto flex-col gap-[8.25px]">
          {isLoadingProductsData ? (
            <>
              {Array.from({ length: 4 }, (_, index) => {
                return (
                  <div key={index}>
                    <Skeleton
                      style={{
                        backgroundColor: t.background_2,
                      }}
                      className="w-[100%] h-[58px] rounded-[9px] flex flex-row gap-[10px] py-[9px] px-[12px]"
                    >
                      <div
                        style={{
                          backgroundColor: t.background_3,
                        }}
                        className="aspect-[1/1] rounded-[6px] h-[100%] "
                      ></div>
                    </Skeleton>
                  </div>
                );
              })}
            </>
          ) : (
            localProductsData.map((product, index) => {
              const foundLinks = mediaLinks.filter(
                (mediaLink: MediaLink) =>
                  mediaLink.entity_id === product.id &&
                  mediaLink.entity_type === "product"
              );

              return (
                <div
                  key={index}
                  style={{
                    backgroundColor:
                      currentProductId &&
                      currentProductId === product.serial_number
                        ? "rgba(255,255,255,0.057)"
                        : "rgba(255,255,255,0.028)",
                  }}
                  className="w-[100%] h-[58px] rounded-[9px] items-center hover:brightness-[86%] dim cursor-pointer flex flex-row gap-[10px] py-[9px] px-[12px]"
                  onClick={() => handleProductClick(product)}
                >
                  <div
                    style={{
                      backgroundColor:
                        currentProductId === product.serial_number
                          ? t.background_3_2
                          : t.background_3,
                    }}
                    className="select-none min-w-[40px] w-[40px] h-[40px] min-h-[40px] rounded-[6px] overflow-hidden"
                  >
                    {foundLinks.length > 0 && (
                      <>
                        {/\.(mp4|mov)$/i.test(foundLinks[0].url) ? (
                          <video
                            src={foundLinks[0].url}
                            className="w-full h-full object-cover"
                            playsInline
                            muted
                            loop
                          />
                        ) : (
                          <img
                            draggable={false}
                            className="w-full h-full object-cover"
                            src={foundLinks[0].url}
                          />
                        )}
                      </>
                    )}
                  </div>
                  <div className="select-none flex w-[136px] h-[100%] flex-col gap-[2px] ">
                    <div className="text-[15px] leading-[20px] font-[500] opacity-70 truncate w-[100%]">
                      {product.name ? product.name : product.serial_number}
                    </div>
                    <div className="text-[14px] leading-[18px] font-[400] opacity-40 truncate w-[100%]">
                      {product.make} {product.model && "|"} {product.model}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ModuleLeftBar;
