// src/icons/ProductsDataIcon.tsx
import React from "react";

type ProductsDataIconProps = {
  color?: string;
  size?: number;
  className?: string;
};

const ProductsDataIcon: React.FC<ProductsDataIconProps> = ({
  color = "currentColor",
  size = 22,
  className = "",
}) => {
  return (
    <div
      style={{ width: size + "px" }}
      className="pl-[2px] mt-[-0.5px] justify-center flex flex-col gap-[1.6px] "
    >
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="w-[77%] h-[3px] rounded-[1.1px]"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
};

export default ProductsDataIcon;
