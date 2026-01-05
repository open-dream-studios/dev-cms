// shared/types/models/public/customerData.ts
export type CustomerData = {
  customerInfo: any,
  customerProducts: any,
  customerJobs: any,
  customerSchedule: any
}

export const emptyCustomerData: CustomerData = {
  customerInfo: null,
  customerProducts: [],
  customerJobs: [],
  customerSchedule: [],
};