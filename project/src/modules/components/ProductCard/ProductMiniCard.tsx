// project/src/modules/components/ProductCard/ProductMiniCard.tsx
import { AuthContext } from "@/contexts/authContext";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { Media, MediaLink, Product } from "@open-dream/shared";
import React, { useContext, useMemo } from "react";
import NoProductImage from "./NoProductImage";
import RenderedImage from "./RenderedImage";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { usePathname } from "next/navigation";
import { useContextMenuStore } from "@/store/util/contextMenuStore";
import { createProductContextMenu } from "@/modules/CustomerProducts/_actions/products.actions";

const ProductMiniCard = ({
  product,
  index,
  handleProductClick,
}: {
  product: Product;
  index: number;
  handleProductClick: (product: Product) => void;
}) => {
  const currentTheme = useCurrentTheme();
  const { currentUser } = useContext(AuthContext);
  const { mediaLinks, media } = useContextQueries();
  const pathname = usePathname();
    const { openContextMenu } = useContextMenuStore();

  const foundLinks = mediaLinks.filter(
    (mediaLink: MediaLink) =>
      mediaLink.entity_id === product.id && mediaLink.entity_type === "product"
  );
  const matchedMedia = !foundLinks.length
    ? null
    : media.find((item: Media) => item.id === foundLinks[0].media_id);

  const currentProductSerial = useMemo(() => {
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
      key={index}
      onContextMenu={(e) => {
        e.preventDefault();
        openContextMenu({
          position: { x: e.clientX, y: e.clientY },
          target: product,
          menu: createProductContextMenu(),
        });
      }}
      style={{
        background:
          currentUser.theme === "dark"
            ? currentProductSerial === product.serial_number
              ? "linear-gradient(180deg, #282828, #2B2B2B)"
              : "linear-gradient(180deg, #1E1E1E, #1A1A1A)"
            : currentProductSerial === product.serial_number
            ? currentTheme.background_2
            : currentTheme.background_1,
        boxShadow:
          currentUser.theme === "dark"
            ? "none"
            : "0px 0px 6px 2px rgba(0, 0, 0, 0.09)",
      }}
      className="w-[calc(100%-30px)] ml-[15px] h-[58px] rounded-[9px] items-center hover:brightness-[92%] dim cursor-pointer flex flex-row gap-[10px] py-[9px] px-[12px]"
      onClick={() => handleProductClick(product)}
    >
      <div className="select-none min-w-[40px] w-[40px] h-[40px] min-h-[40px] rounded-[6px] overflow-hidden">
        {foundLinks.length > 0 && matchedMedia ? (
          <RenderedImage media={matchedMedia} rounded={true} />
        ) : (
          <div
            className={`w-[100%] h-[100%] ${
              product.serial_number === currentProductSerial
                ? "brightness-90"
                : "brightness-100"
            }`}
          >
            <NoProductImage />
          </div>
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
};

export default ProductMiniCard;
