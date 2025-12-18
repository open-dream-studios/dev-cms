// project/src/modules/CustomerProducts/DraggableItem.tsx
"use client";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor,
  MouseSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useContext, useRef } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import { toast } from "react-toastify";
import CustomerProductFrame from "../components/ProductCard/CustomerProductFrame";
import { IoCloseOutline } from "react-icons/io5";
import { Product } from "@open-dream/shared";
import InventoryRow from "./Grid/InventoryRow";
import { useUiStore } from "@/store/useUIStore";
import { useProductFormSubmit } from "@/hooks/forms/useProductForm";
import { useDataFilters } from "@/hooks/useDataFilters";
import { setLocalProductsData, useCurrentDataStore } from "@/store/currentDataStore";
import { DelayType } from "@/hooks/util/useAutoSave";
import { useCurrentTheme } from "@/hooks/util/useTheme";

function SortableItem({
  resetTimer,
  id,
  product,
  index,
  sheet,
}: {
  resetTimer: (delay: DelayType) => void;
  id: string;
  product: Product;
  index: number;
  sheet: boolean;
}) {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { editingProducts } = useUiStore();
  const { saveProducts } = useProductFormSubmit();
  const { deleteProducts } = useContextQueries();
  const { inventoryView } = useUiStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : 1,
    position: "relative",
  };

  const handleDeleteProduct = async (item: Product) => {
    if (!item.product_id) return;
    try {
      await saveProducts();
      await deleteProducts([item.product_id]);
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  if (!currentUser) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="relative w-full h-[100%]"
    >
      <div className="group/grabber relative w-full h-[100%] cursor-pointer">
        {editingProducts && (
          <div
            {...listeners}
            className="absolute top-0 left-0 w-full h-full z-[902] cursor-pointer touch-none"
          />
        )}

        {editingProducts && !inventoryView && (
          <div
            style={{
              border: `1px solid ${currentTheme.text_4}`,
              backgroundColor: currentTheme.background_1,
            }}
            className="absolute top-[-8px] right-[-9px] z-[950] w-[26px] h-[26px] flex items-center justify-center dim hover:brightness-75 cursor-pointer rounded-[20px]"
            onClick={() => handleDeleteProduct(product)}
          >
            <IoCloseOutline color={currentTheme.text_2} />
          </div>
        )}

        <div className="dim cursor-pointer hover:brightness-[86%] h-[100%]">
          {sheet ? (
            <InventoryRow
              index={index}
              product={product}
              resetTimer={resetTimer}
            />
          ) : (
            <div
              key={product.serial_number}
              className="relative w-[100%] h-[100%]"
            >
              <CustomerProductFrame product={product} index={index} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const DraggableItems = ({
  sheet,
  resetTimer,
}: {
  sheet: boolean;
  resetTimer: (delay: DelayType) => void;
}) => {
  const { currentUser } = useContext(AuthContext);
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(PointerSensor)
  );
  const { localProductsData } = useCurrentDataStore();
  const { saveProducts } = useProductFormSubmit();
  const { filteredProducts } = useDataFilters();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localProductsData.findIndex(
      (item) => item.serial_number === active.id
    );
    const newIndex = localProductsData.findIndex(
      (item) => item.serial_number === over.id
    );

    const reordered = arrayMove(localProductsData, oldIndex, newIndex).map(
      (product, i, arr) => ({
        ...product,
        ordinal: arr.length - 1 - i,
      })
    );

    setLocalProductsData(reordered);
    await saveProducts();
  };

  if (!currentUser) return null;

  if (!sheet) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToParentElement]}
      >
        <SortableContext
          items={localProductsData.map((p) => p.serial_number ?? "")}
          strategy={rectSortingStrategy}
        >
          <div
            ref={containerRef}
            className="relative pt-[8px] grid grid-cols-1 min-[640px]:grid-cols-2 min-[1500px]:grid-cols-3 gap-[17px] md:gap-[20px] lg:gap-[22px] h-auto"
          >
            {filteredProducts(localProductsData).map((product, index) => (
              <SortableItem
                key={product.serial_number}
                id={product.serial_number ?? ""}
                product={product}
                index={index}
                sheet={sheet}
                resetTimer={resetTimer}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext
        items={localProductsData.map((p) => p.serial_number ?? "")}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col max-h-full pb-[46px] mb-[46px]">
          {filteredProducts(localProductsData).map((product, index) => (
            <SortableItem
              key={product.serial_number}
              id={product.serial_number ?? ""}
              product={product}
              index={index}
              sheet={sheet}
              resetTimer={resetTimer}
            />
          ))}
        </div>
        <div className="h-[61px] w-[100%]" />
      </SortableContext>
    </DndContext>
  );
};

export default DraggableItems;
