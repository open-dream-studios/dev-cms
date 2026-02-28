// server/handlers/webhooks/stripe/handlers/payment_received_handler.ts
import Stripe from "stripe"; 
import { PoolConnection } from "mysql2/promise";

export const handlePaymentReceived = async (
  connection: PoolConnection,
  stripe: Stripe,
  event: Stripe.Event,
  test_mode: boolean
) => {
  console.log(JSON.stringify(event))
};
