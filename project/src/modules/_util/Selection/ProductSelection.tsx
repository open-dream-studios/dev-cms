// project/modules/_util/Selection/ProductSelection.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useContext, useState } from "react";
import { IoTrashSharp } from "react-icons/io5";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { FaChevronLeft } from "react-icons/fa6";
import { Product } from "@open-dream/shared";

const ProductSelectCard = ({
  product,
  onSelect,
}: {
  product: Product;
  onSelect: (product: Product) => void;
}) => {
  const currentTheme = useCurrentTheme();
  const { currentUser } = useContext(AuthContext);

  if (!currentUser) return null;

  return (
    <div
      onClick={() => {
        onSelect(product);
      }}
      key={product.product_id}
      style={{
        backgroundColor: currentTheme.background_1_3,
      }}
      className={`hover:brightness-[88%] dim cursor-pointer flex justify-between items-center rounded-[10px] px-[20px] py-[10px]`}
    >
      <div className="w-[calc(100%-90px)] truncate">
        <p className="font-semibold truncate">{product.name}</p>
        <p style={{ color: currentTheme.text_4 }} className="text-sm truncate">
          {product.serial_number}
        </p>
      </div>
    </div>
  );
};

const ProductSelection = ({
  onSelect,
  onClear,
  clearable,
}: {
  onSelect: (product: Product) => void;
  onClear: () => void;
  clearable: boolean;
}) => {
  const { currentUser } = useContext(AuthContext);
  const { productsData } = useContextQueries();
  const currentTheme = useCurrentTheme();

  const [selected, setSelected] = useState<Product | null>(null);

  if (!currentUser) return null;

  return (
    <div className="w-[100%] h-[100%] pl-[50px] lg:pl-[80px] pr-[25px] lg:pr-[55px] pt-[40px] flex flex-col gap-[12px]">
      <div className="flex flex-row justify-between w-[100%] pr-[25px] items-center">
        <div className="flex flex-row gap-[12px] items-center">
          {selected && (
            <div
              onClick={() => setSelected(null)}
              style={{ backgroundColor: currentTheme.background_3 }}
              className="cursor-pointer mt-[3px] dim hover:brightness-75 flex items-center justify-center h-[38px] rounded-full w-[38px] opacity-[30%]"
            >
              <FaChevronLeft size={22} color={currentTheme.text_3} />
            </div>
          )}
          <div className="flex flex-row gap-[13px] flex-1">
            <div className="text-[25px] md:text-[31px] font-[600]  whitespace-nowrap">
              Products
            </div>
          </div>
        </div>
        <div className="flex flex-row gap-[8px]">
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
      </div>
      <div className="flex flex-col gap-[9px] pr-[25px] flex-1 overflow-auto pb-[30px]">
        {productsData.map((product: Product, index: number) => {
          return (
            <ProductSelectCard
              key={index}
              product={product}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ProductSelection;
