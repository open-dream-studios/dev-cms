// project/src/modules/_util/Search/_hooks/search.hooks.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { runSearchMatch } from "../_helpers/customerSearch.helpers";

type Options<T> = {
  items: T[];
  searchTerm: string;
  searchContext: any;
  setSearchContext: (ctx: any) => void;
  determineContext: (raw: string, items: T[]) => any;
  selectedItem?: T | null;
  getItemId: (item: T) => string;
  externalTrigger?: any;
};

export function useSearchableScrollList<T>({
  items,
  searchTerm,
  searchContext,
  setSearchContext,
  determineContext,
  selectedItem,
  getItemId,
  externalTrigger,
}: Options<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const ignoreNextSearchRef = useRef(false);
  const [pendingScroll, setPendingScroll] = useState(false);

  /*
    SELECTED SCROLL
  */
  useEffect(() => {
    if (!selectedItem) return;
    ignoreNextSearchRef.current = true;
    setSearchContext(null);
    setPendingScroll(true);
  }, [selectedItem, externalTrigger]);

  useEffect(() => {
    if (!pendingScroll) return;
    if (!selectedItem) return;
    if (!items.length) return;

    const id = getItemId(selectedItem);
    const el = itemRefs.current[id];

    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ block: "start" });
        setPendingScroll(false);
      });
    }
  }, [pendingScroll, items, selectedItem]);

  /*
    SEARCH CONTEXT
  */
  useEffect(() => {
    if (ignoreNextSearchRef.current) {
      ignoreNextSearchRef.current = false;
      return;
    }

    const trimmed = searchTerm.trim();

    if (!trimmed) {
      if (searchContext !== null) setSearchContext(null);
      return;
    }

    if (!items.length) return;

    const ctx = determineContext(trimmed, items);

    if (
      searchContext &&
      JSON.stringify(searchContext.parsed) ===
        JSON.stringify(ctx.parsed) &&
      searchContext.type === ctx.type
    ) {
      return;
    }

    setSearchContext(ctx);
  }, [searchTerm, items]);

  /*
    FILTER
  */
  const filteredItems = useMemo(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed || !searchContext) return items;

    return items.filter((item) => {
      const schema = searchContext.schema(item);
      const result = runSearchMatch(searchContext.parsed, schema);
      return result.isMatch;
    });
  }, [items, searchContext, searchTerm]);

  /*
    RESET SCROLL
  */
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = 0;
  }, [filteredItems]);

  return {
    containerRef,
    itemRefs,
    filteredItems,
  };
}