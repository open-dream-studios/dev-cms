// project/src/app/(app)/products/layout.tsx
"use client";
import { HomeLayout } from "@/layouts/homeLayout";
import CustomersProductsModuleLeftBar from "@/modules/CustomerProducts/CustomerProductsModuleLeftBar";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentProduct } = useCurrentDataStore();
  const { addingProduct } = useUiStore();

  return (
    <HomeLayout
      left={
        !currentProduct && !addingProduct ? (
          null
        ) : (
          <CustomersProductsModuleLeftBar />
        )
      }
    >
      {children}
    </HomeLayout>
  );
}
