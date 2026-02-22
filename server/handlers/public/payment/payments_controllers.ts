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
import { changeToHTTPSDomain } from "../../../functions/data.js";

export const getStripeCheckoutLink = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const projectDomain = getProjectDomainFromWixRequest(req);
  const project_idx = await getProjectIdByDomain(projectDomain);
  if (!project_idx) {
    return { success: false, message: "No project id found" };
  }
  const currentProject = await getProjectByIdFunction(project_idx);
  if (!currentProject || !currentProject.domain) {
    return { success: false, message: "No project domain found" };
  }

  const { selectedDay, customer, product_type, return_page } = req.body;
  if (!selectedDay || !customer || !product_type) {
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
  const baseUrl = changeToHTTPSDomain(
    `${currentProject.domain}${return_page ?? ""}`
  );

  const formattedAddress = address?.formatted ?? "";
  console.log(address, formattedAddress)

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
      success_url: `${baseUrl}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}?checkout=cancel`,

      metadata: {
        email,
        name,
        phone: phone ?? "",
        address: formattedAddress,
        selected_day: String(selectedDay),
        product_type,
        project_id: String(project_idx),
        source: "wix_public",
      },

      // 🔑 REQUIRED for subscriptions
      ...(product.mode === "subscription" && {
        subscription_data: {
          metadata: {
            email,
            name,
            phone: phone ?? "",
            address: formattedAddress,
            selected_day: String(selectedDay),
            product_type,
            project_id: String(project_idx),
            source: "wix_public",
          },
        },
      }),
    });

  return {
    success: true,
    url: session.url,
  };
};
