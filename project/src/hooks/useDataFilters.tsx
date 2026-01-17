// project/src/hooks/useDataFilters.tsx
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { Job, JobDefinition, Product } from "@open-dream/shared";

export function useDataFilters() {
  const { productFilters } = useCurrentDataStore();
  const { jobs, jobDefinitions } = useContextQueries();

  const filteredProducts = (products: Product[]) => {
    const filterProducts = (products: Product[]) => {
      // if no filters, just return everything
      if (productFilters.products.length === 0) return products;

      return products.filter((product: Product) => {
        const productJobs = jobs.filter(
          (job: Job) => job.product_id === product.id
        );

        // check each active filter
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
      const addProductsByType = (type: string) => {
        const definition = jobDefinitions.find(
          (def: JobDefinition) => def.type && def.type.toLowerCase() === type.toLowerCase()
        );
        if (!definition?.id) return;
        const filtered = products.filter((product: Product) => {
          const productJobs = jobs.filter(
            (job: Job) => job.product_id === product.id
          );
          return productJobs.some(
            (job: Job) => job.job_definition_id === definition.id
          );
        });
        filtered.forEach((p) => resultSet.add(p));
      };
      if (productFilters.jobType.includes("Service")) {
        addProductsByType("Service");
      }
      if (productFilters.jobType.includes("Refurbishment")) {
        addProductsByType("Refurbishment");
      }
      if (productFilters.jobType.includes("Sale")) {
        addProductsByType("Sale");
      }
      return Array.from(resultSet);
    };

    if (products.length === 0) return [];
    let filteredList = filterProducts(products);
    filteredList = filterJobType(filteredList);
    return filteredList;
  };

  return {
    filteredProducts,
  };
}
