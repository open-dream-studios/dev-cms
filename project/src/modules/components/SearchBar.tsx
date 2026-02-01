// project/src/modules/components/SearchBar.tsx
import { AuthContext } from "@/contexts/authContext";
import React, { useContext, useEffect } from "react";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { Search } from "lucide-react";

const SearchBar = () => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { currentCustomerSearchTerm, setCurrentCustomerSearchTerm } =
    useCurrentDataStore();

  const inputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = currentCustomerSearchTerm || "";
    }
  }, [currentCustomerSearchTerm]);

  if (!currentUser) return null;

  return (
    <div
      className="rounded-[8px] w-[100%] h-[100%] flex items-center px-[10px] flex-row gap-[5px]"
      style={{
        backgroundColor:
          currentUser.theme === "dark"
            ? "rgba(255,255,255,0.028)"
            : currentTheme.background_1_3,
      }}
    >
      <Search color={currentTheme.text_3} size={15} className="opacity-[0.7]" />
      <input
        ref={inputRef}
        type="text"
        className="w-[100%] truncate border-none outline-none font-[400] text-[13px] opacity-[0.72]"
        onChange={(e) => {
          setCurrentCustomerSearchTerm(e.target.value);
        }}
      />
    </div>
  );
};

export default SearchBar;
