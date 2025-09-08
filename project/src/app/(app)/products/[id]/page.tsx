// project/src/app/(app)/products/[id]/page.tsx
"use client";
import { useContext } from "react";
import { useParams } from "next/navigation";
import { AuthContext } from "@/contexts/authContext";
import ProductView from "@/modules/CustomerProducts/ProductView/ProductView";

const Product = () => {
  const { currentUser } = useContext(AuthContext);
  const params = useParams();
  const serialNumber = params?.id as string;

  if (!currentUser) return null;

  return <ProductView serialNumber={serialNumber} />;
  return 
};

export default Product;
