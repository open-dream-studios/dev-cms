// project/src/app/(app)/products/[id]/page.tsx
"use client";
import { useContext, useEffect } from "react";
import { useParams } from "next/navigation";
import { AuthContext } from "@/contexts/authContext";
import ProductView from "@/modules/CustomerProducts/ProductView/ProductView";
import ModuleLeftBar from "@/modules/components/ModuleLeftBar";

const Product = () => {
  const { currentUser } = useContext(AuthContext);
  const params = useParams();
  const serialNumber = params?.id as string;

  if (!currentUser) return null;

  return (
    <div className="w-[100%] h-[100%] flex flex-row">
      <ModuleLeftBar />
      <div className="flex-1">
        <ProductView serialNumber={serialNumber} />;
      </div>
    </div>
  );
};

export default Product;
