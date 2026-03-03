// project/src/modules/_util/Search/_actions/productSearch.actions.ts
import { Product } from "@open-dream/shared";
import {
  highlightText,
  runSearchMatch,
} from "../_helpers/customerSearch.helpers";
import { useSearchUIStore } from "../_store/search.store";

export function getProductCardSearchDisplay(product: Product) {
  const { productSearchContext } = useSearchUIStore.getState();

  if (!productSearchContext) {
    return {
      name: product.name ?? product.serial_number ?? "",
      makeModel: `${product.make ?? ""} ${product.model ?? ""}`,
      serial: product.serial_number ?? "",
    };
  }

  const schema = productSearchContext.schema(product);
  const result = runSearchMatch(productSearchContext.parsed, schema);

  const highlight = (text: string, key: string) =>
    highlightText(text, result.matched[key] ?? [], () => ({
      backgroundColor: "rgba(180,215,255,0.7)",
      color: "black",
    }));

  return {
    name:
      productSearchContext.type === "name"
        ? highlight(product.name ?? "", "name")
        : product.name ?? "",

    serial:
      productSearchContext.type === "serial"
        ? highlight(product.serial_number ?? "", "serial")
        : product.serial_number ?? "",

    makeModel:
      productSearchContext.type === "make_model"
        ? [
            highlight(product.make ?? "", "make"),
            " ",
            highlight(product.model ?? "", "model"),
          ]
        : `${product.make ?? ""} ${product.model ?? ""}`,
  };
}
