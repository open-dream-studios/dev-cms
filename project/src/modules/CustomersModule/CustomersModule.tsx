// project/src/modules/CustomersModule/CustomersModule.tsx
import { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import CustomerView from "./CustomerView";
import { useUiStore } from "@/store/useUIStore";
import { useCurrentDataStore } from "@/store/currentDataStore";
import CustomerManager from "./CustomerManager";
import { HomeLayout } from "@/layouts/homeLayout";
import CustomersModuleLeftBar from "./CustomersModuleLeftBar";

const CustomersModule = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentCustomer, currentProjectId } = useCurrentDataStore();
  const { addingCustomer } = useUiStore();

  if (!currentUser || !currentProjectId) return null;

  return (
    <HomeLayout left={<CustomersModuleLeftBar/>}>
      {addingCustomer || currentCustomer ? (
        <CustomerView />
      ) : (
        <CustomerManager />
      )}
    </HomeLayout>
  );
};

export default CustomersModule;
