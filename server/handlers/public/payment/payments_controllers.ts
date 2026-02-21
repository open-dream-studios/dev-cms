// server/handlers/public/payment/payments_controllers.ts
import Stripe from "stripe";
import type { PoolConnection } from "mysql2/promise";
import type { Request, Response } from "express";
import { stripeProducts, StripeProductKey } from "@open-dream/shared";
import { getProjectDomainFromWixRequest } from "../../../util/verifyWixRequest.js";
import {
  getProjectByIdFunction,
  getProjectIdByDomain,
} from "../../projects/projects_repositories.js";

export const getStripeCheckoutLink = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const { selectedDay, customer, product_type, return_domain } = req.body;
  if (!selectedDay || !customer || !product_type || !return_domain) {
    return { success: false, message: "Missing required fields" };
  }
  const { name, email, phone, address } = customer;
  if (!name || !email) {
    return { success: false, message: "Missing required fields" };
  }

  if (!Object.keys(stripeProducts).includes(product_type)) {
    return { success: false, message: "Invalid product type" };
  }

  const product = stripeProducts[product_type as StripeProductKey];

  // 1️⃣ Find or create Stripe customer
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  let stripeCustomerId: string;

  if (existingCustomers.data.length > 0) {
    stripeCustomerId = existingCustomers.data[0].id;
  } else {
    const newCustomer = await stripe.customers.create({
      name,
      email,
      phone,
    });
    stripeCustomerId = newCustomer.id;
  }

  // 2️⃣ Prevent duplicate active subscriptions (recommended)
  if (product.mode === "subscription") {
    const activeSubs = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "active",
      limit: 1,
    });

    if (activeSubs.data.length > 0) {
      return {
        success: false,
        message: "Active subscription already exists for this email",
      };
    }
  }

  // 3️⃣ Create Checkout Session
  const session: Stripe.Checkout.Session =
    await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer: stripeCustomerId,
      line_items: [
        {
          price: product.price_id,
          quantity: 1,
        },
      ],
      mode: product.mode,
      success_url: return_domain,
      cancel_url: return_domain,
      metadata: {
        email,
        name,
        phone: phone ?? "",
        product_type,
        source: "wix_public",
      },
    });

  return {
    success: true,
    url: session.url,
  };
};
