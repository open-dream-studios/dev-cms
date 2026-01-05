// server/handlers/public/customerData/customerData_repositories.ts
import {
  Customer,
  CustomerBase,
  Job,
  Product,
  ScheduleItem,
} from "@open-dream/shared";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";

export const getCustomerDataFunction = async (
  connection: PoolConnection,
  project_idx: number,
  user_id: string,
  user_email: string
) => {
  let customerInfo: any = null;
  let customerProducts: any[] = [];
  let customerJobs: any[] = [];
  let customerSchedule: ScheduleItem[] = [];

  // Get Customer Info
  const customerQ = `
    SELECT *
    FROM customers
    WHERE email = ?
      AND project_idx = ?
    LIMIT 1
  `;

  const [customerRows] = await connection.query<(Customer & RowDataPacket)[]>(
    customerQ,
    [user_email, project_idx]
  );
  const customerInfoReturn =
    customerRows && customerRows.length ? customerRows[0] : null;
  const customer_id = customerInfoReturn && customerInfoReturn.id;

  if (customerInfoReturn) {
    const { id, ...info } = customerInfoReturn;
    customerInfo = info;
  }

  if (customer_id) {
    // Get Customer Products
    const customerProductsQ = `
      SELECT *
      FROM products
      WHERE customer_id = ?
        AND project_idx = ?
    `;
    const [customerProductRows] = await connection.query<
      (RowDataPacket & Product)[]
    >(customerProductsQ, [customer_id, project_idx]);
    const customerProductsReturn = customerProductRows
    if (customerProductRows.length) {
      const items = customerProductRows.map((item) => {
        const { id, ...product } = item;
        return product;
      });
      customerProducts = items;
    }

    // Get Customer Jobs
    const productIds = customerProductsReturn.map((p) => p.id);
    let jobsQ = `
        SELECT *
        FROM jobs
        WHERE project_idx = ?
          AND (
            customer_id = ?
      `;

    const params: any[] = [project_idx, customer_id];

    if (productIds.length > 0) {
      const placeholders = productIds.map(() => "?").join(",");
      jobsQ += ` OR product_id IN (${placeholders})`;
      params.push(...productIds);
    }

    jobsQ += `)`;

    const [customerJobRows] = await connection.query<(RowDataPacket & Job)[]>(
      jobsQ,
      params
    );

    if (customerJobRows.length) {
      const items = customerJobRows.map((item) => {
        const { id, ...job } = item;
        return job;
      });
      customerJobs = items;
    }
  }

  // Get Customer ScheduleItems
  // const customerScheduleItemsQ = `
  //   SELECT *
  //   FROM jobs
  //   WHERE customer_id = ?
  //     AND project_idx = ?
  // `;
  // const [customerScheduleItemRows] = await connection.query<
  //   (RowDataPacket & ScheduleItem)[]
  // >(customerScheduleItemsQ, [customer_id, project_idx]);
  customerSchedule = [];

  return {
    customerInfo,
    customerProducts,
    customerJobs,
    customerSchedule,
  };
};
