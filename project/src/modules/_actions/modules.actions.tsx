// project/src/modules/_actions/modules.actions.tsx
"use client";
import { HiServer, HiViewBoards } from "react-icons/hi";
import { FaImages } from "react-icons/fa";
import ProductsDataIcon from "@/lib/icons/ProductsDataIcon";
import { FaPollH } from "react-icons/fa";
import { IoPersonSharp } from "react-icons/io5";
import { BsFillPersonVcardFill } from "react-icons/bs";
import { IoMdMail } from "react-icons/io";
import { ReactNode } from "react";
import { Screen, User } from "@open-dream/shared";

export type AccessibleModule = {
  key: Screen
  title: string
  pages: Screen[]
}

export const ICON_MAP: Partial<Record<Screen, ReactNode>> = {
  "google-ads": <HiServer />,
  customers: <IoPersonSharp />,
  "customer-products": <HiViewBoards className="w-[17px] h-[17px] brightness-75" />,
  "products-table": <ProductsDataIcon size={22} />,
  gmail: <IoMdMail />,
  pages: <FaPollH />,
  media: <FaImages />,
  employees: <BsFillPersonVcardFill />,
  tasks: <ProductsDataIcon size={22} />,
};

export const buildAccessibleModules = (
  hasProjectModule: (name: string) => boolean,
  currentUser: User | null
): AccessibleModule[] => {
  if (!currentUser) return [];

  const modules: AccessibleModule[] = [];

  if (hasProjectModule("google-ads-api-module")) {
    modules.push({
      key: "google-ads",
      title: "Dashboard",
      pages: ["google-ads"],
    });
  }

  if (hasProjectModule("customer-products-module")) {
    modules.push({
      key: "customer-products",
      title: "Inventory",
      pages: ["customer-products", "edit-customer-product"],
    });
  }

  if (hasProjectModule("customers-module")) {
    modules.push({
      key: "customers",
      title: "Customers",
      pages: ["customers"],
    });
  }

  if (hasProjectModule("google-gmail-module")) {
    modules.push({
      key: "gmail",
      title: "Gmail",
      pages: ["gmail"],
    });
  }

  if (hasProjectModule("pages-module")) {
    modules.push({
      key: "pages",
      title: "Website",
      pages: ["pages"],
    });
  }

  if (
    hasProjectModule("media-module") &&
    hasProjectModule("global-media-module")
  ) {
    modules.push({
      key: "media",
      title: "Media",
      pages: ["media"],
    });
  }

  if (hasProjectModule("products-module")) {
    modules.push(
      {
        key: "products",
        title: "Products",
        pages: ["products"],
      },
      {
        key: "products-table",
        title: "Data",
        pages: ["products-table"],
      }
    );
  }

  if (hasProjectModule("employees-module")) {
    modules.push({
      key: "employees",
      title: "Employees",
      pages: ["employees"],
    });
  }

  if (hasProjectModule("tasks-module")) {
    modules.push({
      key: "tasks",
      title: "Tasks",
      pages: ["tasks"],
    });
  }

  return modules;
};
