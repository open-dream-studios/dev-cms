// project/src/modules/components/ModuleLeftBar.tsx
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import Divider from "@/lib/blocks/Divider";
import { Customer, Product, Employee } from "@open-dream/shared";
import React, { use, useContext } from "react";
import { FaPlus } from "react-icons/fa6";
import EmployeeMiniCard from "../EmployeesModule/EmployeeMiniCard";
import { employeeToForm } from "@/util/schemas/employeeSchema";
import { useUiStore } from "@/store/useUIStore";
import { useFormInstanceStore } from "@/store/formInstanceStore";
import { setCurrentEmployeeData, setCurrentProductData, useCurrentDataStore } from "@/store/currentDataStore";
import { useEmployeeFormSubmit } from "@/hooks/forms/useEmployeeForm";
import { useRouting } from "@/hooks/useRouting";
import { useProductFormSubmit } from "@/hooks/forms/useProductForm";
import { productToForm } from "@/util/schemas/productSchema";
import { useCurrentTheme } from "@/hooks/useTheme";
import { GoSync } from "react-icons/go";
import { useQueryClient } from "@tanstack/react-query";
import ProductMiniCard from "./ProductCard/ProductMiniCard";
import ProductMiniCardSkeleton from "@/lib/skeletons/ProductMiniCardSkeleton";
import CatalogMiniCardSkeleton from "@/lib/skeletons/CatalogMiniCardSkeleton";
import SearchBar from "./SearchBar";
import CustomerLeftBar from "../CustomersModule/CustomerLeftBar";
import { useContextMenu } from "@/hooks/useContextMenu";
import { useCustomers } from "@/hooks/useCustomers";
import ContextMenu from "@/components/Popups/ContextMenu";

const ModuleLeftBar = () => {
  const queryClient = useQueryClient();
  const { currentProject } = useCurrentDataStore();
  const { currentUser } = useContext(AuthContext);
  const {
    isLoadingProductsData,
    deleteEmployee,
    employees,
    refetchCustomers,
    runModule,
    isLoadingEmployees,
  } = useContextQueries();
  const { localProductsData, currentProjectId } =
    useCurrentDataStore();
  const { screenClick } = useRouting();
  const { getForm } = useFormInstanceStore();
  const { setUpdatingLock } = useUiStore();
  const { screen, setAddingEmployee, addingProduct, setAddingProduct } =
    useUiStore();
  const { handleCustomerClick, handleDeleteCustomer } = useCustomers();
  const { contextMenu, openContextMenu } = useContextMenu<
    Customer | Employee
  >();
  const currentTheme = useCurrentTheme();

  const productForm = getForm("product");
  const { onProductFormSubmit } = useProductFormSubmit();

  const employeeForm = getForm("employee");
  const { onEmployeeFormSubmit } = useEmployeeFormSubmit();

  const handleDeleteEmployee = async (employee: Employee | null) => {
    if (!employee || !employee.employee_id) return;
    await deleteEmployee(employee.employee_id);
    if (employeeForm) {
      employeeForm.reset(employeeToForm(null));
    }
    setCurrentEmployeeData(null);
    setAddingEmployee(true);
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
          <ContextMenu
            action1Message={"Delete customer"}
            action1Click={handleDeleteCustomer}
          />
        )}
        {contextMenu && screen === "employees" && (
          <ContextMenu
            action1Message={"Delete employee"}
            action1Click={handleDeleteEmployee}
          />
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
        {screen === "customers" && (
          <div className="mt-[8px] h-[26px]">
            <SearchBar />
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 h-[100%]">
        {screen === "customers" && <CustomerLeftBar />}

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
                      handleContextMenu={(e) => openContextMenu(e, employee)}
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
