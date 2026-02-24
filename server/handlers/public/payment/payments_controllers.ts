// server/handlers/public/payment/payments_controllers.ts
import Stripe from "stripe";
import type { PoolConnection } from "mysql2/promise";
import type { Request, Response } from "express";
import {
  stripeProducts,
  StripeProductKey,
  manageSubscriptionEmail,
  appDetailsProjectByDomain,
  normalizeDomain
} from "@open-dream/shared";
import {
  getProjectByIdFunction,
  getProjectIdByDomain,
} from "../../projects/projects_repositories.js";
import { changeToHTTPSDomain } from "../../../functions/data.js";
import { getProjectDomainFromWixRequest } from "../../../util/verifyWixRequest.js";
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
  // if (product.mode === "subscription") {
  //   const activeSubs = await stripe.subscriptions.list({
  //     customer: stripeCustomerId,
  //     status: "active",
  //     limit: 1,
  //   });

  //   if (activeSubs.data.length > 0) {
  //     return {
  //       success: false,
  //       message: "Active subscription already exists for this email",
  //     };
  //   }
  // }

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
    console.log("⚠️ Portal Email Failed ", "No project id found");
    return { success: true };
  }
  const currentProject = await getProjectByIdFunction(project_idx);
  if (
    !currentProject ||
    !currentProject.domain ||
    !currentProject.backend_domain
  ) {
    console.log("⚠️ Portal Email Failed ", "No project domain found");
    return { success: true };
  }

  const { email } = req.body;
  if (!email) {
    console.log("⚠️ Portal Email Failed ", "Missing email");
    return { success: true };
  }
  console.log(email);

  // 1️⃣ Find Stripe customer by email
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (!customers.data.length) {
    console.log("⚠️ Portal Email Failed ", "Stripe customer not found");
    return { success: true };
  }
  const customer = customers.data[0];

  // 2️⃣ Optional: ensure they actually have active subscriptions
  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    status: "active",
    limit: 1,
  });

  if (!subscriptions.data.length) {
    console.log(
      "⚠️ Portal Email Failed ",
      "Stripe customer has no active subscriptions"
    );
    return { success: true };
  }

  // 3️⃣ Create ONE portal session (customer-scoped)
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customer.id,
    return_url: changeToHTTPSDomain(currentProject.domain),
  });
  console.log(customer.name);

  const decryptedKeys = await getGmailKeys(project_idx);

  if (
    decryptedKeys?.GOOGLE_CLIENT_SECRET_OBJECT &&
    decryptedKeys?.GOOGLE_REFRESH_TOKEN_OBJECT
  ) {
    const gmailClient = await getGmailClient(
      decryptedKeys.GOOGLE_CLIENT_SECRET_OBJECT,
      decryptedKeys.GOOGLE_REFRESH_TOKEN_OBJECT
    );

    const foundProject = appDetailsProjectByDomain(
      normalizeDomain(currentProject.backend_domain)
    );
    if (!foundProject || !foundProject.email_config) {
      console.log(
        "⚠️ Portal Email Failed ",
        "Project details not found"
      );
      return { success: true };
    }

    const config = foundProject.email_config;

    const body = manageSubscriptionEmail({
      businessName: config.businessName,
      customerName: customer.name ?? null,
      logoUrl: config.logoUrl,
      manageSubscriptionUrl: portalSession.url,
      primaryColor: config.primaryColor,
      phoneNumber: config.phoneNumber,
    });

    console.log(body);

    return await sendGmail(
      gmailClient,
      email,
      "Manage Your Subscription",
      body
    );
  } else {
    console.log("⚠️ Portal Email Failed ", "Keys not found");
    return { success: true };
  }
};
