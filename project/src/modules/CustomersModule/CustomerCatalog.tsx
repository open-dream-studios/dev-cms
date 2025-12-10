// project/src/modules/CustomersModule/CustomerCatalog.tsx
import { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import CustomerView from "./CustomerView";
import ModuleLeftBar from "../components/ModuleLeftBar";
import { useUiStore } from "@/store/useUIStore";
import { useCurrentDataStore } from "@/store/currentDataStore";
import CustomerManager from "./CustomerManager";

const CustomerCatalog = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentCustomer, currentProjectId } = useCurrentDataStore();
  const { addingCustomer } = useUiStore();

  if (!currentUser || !currentProjectId) return null;

  return (
    <div className="flex w-full h-[100%]">
      <ModuleLeftBar />
      <div className="flex-1">
        {(currentCustomer || addingCustomer) ? <CustomerView /> : <CustomerManager />}
      </div>
    </div>
  );
};

export default CustomerCatalog;
