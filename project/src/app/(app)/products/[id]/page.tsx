// project/src/app/(app)/products/[id]/page.tsx
"use client";
import { useContext, useEffect } from "react";
import { useParams } from "next/navigation";
import { AuthContext } from "@/contexts/authContext";
import ProductView from "@/modules/CustomerProducts/ProductView/ProductView";
import ModuleLeftBar from "@/modules/components/ModuleLeftBar";
import { useAppContext } from "@/contexts/appContext";

const Product = () => {
  const { currentUser } = useContext(AuthContext);
  const params = useParams();
  const { screen } = useAppContext();
  const serialNumber = params?.id as string;

  if (!currentUser) return null;

  return (
    <div className="w-[100%] h-[100%] flex flex-row">
      {screen === "edit-customer-product" && <ModuleLeftBar />}
      <div className="flex-1">
        <ProductView serialNumber={serialNumber} />
      </div>
    </div>
  );
};

export default Product;
