// project/src/modules/PaymentModule/_helpers/payments.helpers.tsx
export const formatStripeDate = (date: any) => {
  return date
    ? new Date(date * 1000).toISOString().slice(0, 19).replace("T", " ")
    : null;
};

export const formatStripeAmount = (amount: string) => {
  return (parseInt(amount) / 100).toFixed(2);
};