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
import { useAppContext } from "@/contexts/appContext";
import { toast } from "react-toastify";
import CustomerProductFrame from "../components/ProductCard/CustomerProductFrame";
import { appTheme } from "@/util/appTheme";
import { IoCloseOutline } from "react-icons/io5";
import { Product } from "@/types/products";
import InventoryRow from "./Grid/InventoryRow";

function SortableItem({
  id,
  product,
  index,
  sheet,
}: {
  id: string;
  product: Product;
  index: number;
  sheet: boolean;
}) {
  const { currentUser } = useContext(AuthContext);
  const { editMode, saveProducts } = useAppContext();
  const { deleteProducts } = useContextQueries();
  const { screen }  = useAppContext()

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
    try {
      await saveProducts();
      await deleteProducts([item.serial_number]);
      // toast.success("Deleted product");
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
      className="relative w-full"
    >
      <div className="group/grabber relative w-full h-full cursor-pointer">
        {editMode && (
          <div
            {...listeners}
            className="absolute top-0 left-0 w-full h-full z-[902] cursor-pointer touch-none"
          />
        )}

        {editMode && screen !== "customer-products-table" && (
          <div
            style={{
              border: `1px solid ${appTheme[currentUser.theme].text_4}`,
              backgroundColor: appTheme[currentUser.theme].background_1,
            }}
            className="absolute top-[-8px] right-[-9px] z-[950] w-[26px] h-[26px] flex items-center justify-center dim hover:brightness-75 cursor-pointer rounded-[20px]"
            onClick={() => handleDeleteProduct(product)}
          >
            <IoCloseOutline color={appTheme[currentUser.theme].text_2} />
          </div>
        )}

        <div className="dim cursor-pointer hover:brightness-[86%]">
          {sheet ? (
            <InventoryRow index={index} product={product} />
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

const DraggableItems = ({ sheet }: { sheet: boolean }) => {
  const { currentUser } = useContext(AuthContext);
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(PointerSensor)
  );
  const {
    filteredProducts,
    saveProducts,
    localData,
    setLocalData,
    localDataRef,
  } = useAppContext();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localData.findIndex(
      (item) => item.serial_number === active.id
    );
    const newIndex = localData.findIndex(
      (item) => item.serial_number === over.id
    );

    const reordered = arrayMove(localData, oldIndex, newIndex).map(
      (product, i) => ({
        ...product,
        ordinal: i,
      })
    );

    const sorted = reordered.sort(
      (a: Product, b: Product) => (a.ordinal ?? 0) - (b.ordinal ?? 0)
    );

    setLocalData(sorted);
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
          items={localDataRef.current.map((p) => p.serial_number)}
          strategy={rectSortingStrategy}
        >
          <div
            ref={containerRef}
            className="relative pt-[8px] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-[20px] md:gap-[30px]"
          >
            {filteredProducts(localDataRef.current).map((product, index) => (
              <SortableItem
                key={product.serial_number}
                id={product.serial_number}
                product={product}
                index={index}
                sheet={sheet}
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
        items={localDataRef.current.map((p) => p.serial_number)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col max-h-full pb-[46px] mb-[46px]">
          {filteredProducts(localDataRef.current).map((product, index) => (
            <SortableItem
              key={product.serial_number}
              id={product.serial_number}
              product={product}
              index={index}
              sheet={sheet}
            />
          ))}
        </div>
        <div className="h-[61px] w-[100%]" />
      </SortableContext>
    </DndContext>
  );
};

export default DraggableItems;
