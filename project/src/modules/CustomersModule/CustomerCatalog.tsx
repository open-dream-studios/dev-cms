// project/src/modules/CustomersModule/CustomerCatalog.tsx
import { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import CustomerView from "./CustomerView";
import ModuleLeftBar from "../components/ModuleLeftBar";
import { useUiStore } from "@/store/useUIStore";
import { useCurrentDataStore } from "@/store/currentDataStore";

const CustomerCatalog = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId } = useCurrentDataStore();
  const { currentCustomer } = useCurrentDataStore();
  const { addingCustomer } = useUiStore();

  if (!currentUser || !currentProjectId) return null;

  return (
    <div className="flex w-full h-[100%]">
      <ModuleLeftBar />
      <div className="flex-1">
        {(currentCustomer || addingCustomer) && <CustomerView />}
      </div>
    </div>
  );
};

export default CustomerCatalog;
