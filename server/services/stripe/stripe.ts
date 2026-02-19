// server/services/stripe/stripe.ts
export const products = {
  "1X_L1": {
    price_id: "price_1R1ix4E4Dx7gmhhSqvNFQQIc",
    mode: "payment",
    amount: "1.00",
    credits: 5,
  },
  "1X_L2": {
    price_id: "price_1R1ixKE4Dx7gmhhSFNV48ETO",
    mode: "payment",
    amount: "2.00",
    credits: 10,
  },
  "1M_L1": {
    price_id: "price_1R1ixhE4Dx7gmhhShLXK8WvL",
    mode: "subscription",
    amount: "1.00",
  },
  "1M_L2": {
    price_id: "price_1R1ixzE4Dx7gmhhSdME7e0vb",
    mode: "subscription",
    amount: "5.00",
  },
  "1M_L3": {
    price_id: "price_1R1iyFE4Dx7gmhhS1751oWXI",
    mode: "subscription",
    amount: "10.00",
  },
};