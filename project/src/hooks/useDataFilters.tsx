// project/src/hooks/useDataFilters.tsx
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useCustomerUiStore } from "@/modules/CustomersModule/_store/customers.store";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { Customer, Job, JobDefinition, Product } from "@open-dream/shared";

export function useDataFilters() {
  const { productFilters } = useCurrentDataStore();
  const { jobs, jobDefinitions, productsData } = useContextQueries();
  const { contactsFilter } = useCustomerUiStore();

  const filteredProducts = (products: Product[]) => {
    const filterProducts = (products: Product[]) => {
      if (productFilters.products.length === 0) return products;

      return products.filter((product: Product) => {
        const productJobs = jobs.filter(
          (job: Job) => job.product_id === product.id
        );

        return productFilters.products.some((filter) => {
          if (filter === "Complete") {
            return productJobs.some(
              (job: Job) =>
                job.status === "delivered" || job.status === "complete"
            );
          }
          if (filter === "Active") {
            return productJobs.some(
              (job: Job) =>
                job.status !== "delivered" &&
                job.status !== "complete" &&
                job.status !== "cancelled"
            );
          }
          return false;
        });
      });
    };

    const filterJobType = (products: Product[]) => {
      if (productFilters.jobType.length === 0) return products;

      const resultSet = new Set<Product>();

      productFilters.jobType.forEach((type) => {
        const definition = jobDefinitions.find(
          (def: JobDefinition) =>
            def.type && def.type.toLowerCase() === type.toLowerCase()
        );
        if (!definition?.id) return;

        products.forEach((product) => {
          const hasJob = jobs.some(
            (job: Job) =>
              job.product_id === product.id &&
              job.job_definition_id === definition.id
          );
          if (hasJob) resultSet.add(product);
        });
      });

      return Array.from(resultSet);
    };

    let out = filterProducts(products);
    out = filterJobType(out);
    return out;
  };

  const isCustomer = (customer: Customer) => {
    const hasProduct = productsData.some(
      (p: Product) => p.customer_id === customer.id
    );

    const hasJob = jobs.some(
      (j: Job) => j.customer_id === customer.id
    );

    return hasProduct || hasJob;
  };

  const filteredCustomers = (customers: Customer[]) => {
    if (contactsFilter === "contacts") return customers;
    return customers.filter(isCustomer);
  };

  return {
    filteredProducts,
    filteredCustomers,
    isCustomer,
  };
}