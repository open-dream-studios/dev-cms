// project/src/modules/PaymentModule/Script/StripeProvider.tsx
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ReactNode } from "react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

type StripeProviderInterface = {
  children: ReactNode;
};

const StripeProvider = ({ children }: StripeProviderInterface) => {
  return <Elements stripe={stripePromise}>{children}</Elements>;
};

export default StripeProvider;