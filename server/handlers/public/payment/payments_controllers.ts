// server/handlers/public/payment/payments_controllers.ts
import Stripe from "stripe";
import type { PoolConnection } from "mysql2/promise";
import type { Request, Response } from "express";
import { stripeProducts, StripeProductKey } from "@open-dream/shared";
import {
  getProjectByIdFunction,
  getProjectIdByDomain,
} from "../../projects/projects_repositories.js";
import { changeToHTTPSDomain } from "../../../functions/data.js";
import { getProjectDomainFromWixRequest } from "../../../util/verifyWixRequest.js";
import { getUserByEmailFunction } from "../../auth/auth_repositories.js";
import {
  getGmailClient,
  getGmailKeys,
  sendGmail,
} from "../../../services/google/gmail/gmail.js";

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

  const {
    day_instance,
    selected_day,
    selected_slot,
    customer,
    product_type,
    return_page,
  } = req.body;
  if (
    !day_instance ||
    !selected_day ||
    !selected_slot ||
    !customer ||
    !product_type
  ) {
    return { success: false, message: "Missing required fields" };
  }
  const {
    first_name,
    last_name,
    email,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    zip,
  } = customer;
  if (!first_name || !last_name || !email) {
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
      name: `${first_name}${last_name ? " " + last_name : ""}`,
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
        first_name,
        last_name,
        email,
        phone: phone ?? "",
        address_line1: address_line1 ?? "",
        address_line2: address_line2 ?? "",
        city: city ?? "",
        state: state ?? "",
        zip: zip ?? "",
        day_instance: String(day_instance),
        selected_day: String(selected_day),
        selected_slot: String(selected_slot),
        project_id: String(project_idx),
        source: "wix_public",
      },

      // 🔑 REQUIRED for subscriptions
      ...(product.mode === "subscription" && {
        subscription_data: {
          metadata: {
            first_name,
            last_name,
            email,
            phone: phone ?? "",
            address_line1: address_line1 ?? "",
            address_line2: address_line2 ?? "",
            city: city ?? "",
            state: state ?? "",
            zip: zip ?? "",
            day_instance: String(day_instance),
            selected_day: String(selected_day),
            selected_slot: String(selected_slot),
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

export const getStripePortalLink = async (
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

  const { email } = req.body;
  if (!email) {
    return { success: false, code: "missing-email", message: "Missing email" };
  }

  const existingUser = await getUserByEmailFunction(connection, email);
  if (!existingUser || !existingUser.stripe_customer_id) {
    return {
      success: false,
      code: "no-email",
      message: "Email has no subscription history",
    };
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: existingUser.stripe_customer_id,
    return_url: currentProject.domain,
  });

  console.log(portalSession.url);
  const decryptedKeys = await getGmailKeys(project_idx);

  if (
    decryptedKeys?.GOOGLE_CLIENT_SECRET_OBJECT &&
    decryptedKeys?.GOOGLE_REFRESH_TOKEN_OBJECT
  ) {
    const gmailClient = await getGmailClient(
      decryptedKeys.GOOGLE_CLIENT_SECRET_OBJECT,
      decryptedKeys.GOOGLE_REFRESH_TOKEN_OBJECT
    );
    return await sendGmail(
      gmailClient,
      email,
      "TSA - Manage Your Subscription",
      portalSession.url
    );
  } else {
    return { success: false, code: "server-error", message: "Server error" };
  }
};
