// server/handlers/public/payment/payments_controllers.ts
import Stripe from "stripe";
import type { PoolConnection } from "mysql2/promise";
import type { Request, Response } from "express";
import {
  stripeSubscriptionProducts,
  StripeProductKey, 
} from "@open-dream/shared";
import {
  getProjectByIdFunction,
  getProjectIdByDomain,
} from "../../projects/projects_repositories.js";
import { changeToHTTPSDomain } from "../../../functions/data.js";
import { getProjectDomainFromWixRequest } from "../../../util/verifyWixRequest.js";
import { sendStripePortalLinkFunction } from "./payments_repositories.js";
import { insertSubscriptionAgreementFunction } from "./agreements/agreement_repositories.js";

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
    return_page,
    product_level,
    payment_timeline,
    day_instance,
    selected_day,
    selected_slot,
    customer,
    agreement_name,
  } = req.body as {
    return_page: string;
    product_level: number;
    payment_timeline: number;
    day_instance: number;
    selected_day: number;
    selected_slot: number;
    customer: any;
    agreement_name: string;
  };

  if (
    day_instance == null ||
    selected_day == null ||
    selected_slot == null ||
    customer == null ||
    product_level == null ||
    payment_timeline == null ||
    agreement_name == null
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

  const validProductLevels = [0, 1, 2]
  const validPaymentTimelines = [0, 1, 2];

  if (!validProductLevels.includes(product_level)) {
    return { success: false, message: "Invalid product level" };
  }
  if (!validPaymentTimelines.includes(payment_timeline)) {
    return { success: false, message: "Invalid payment timeline" };
  }

  const productKey = `L${product_level + 1}_${payment_timeline === 0 ? "1M" : payment_timeline === 1 ? "6M" : "1Y"}` as StripeProductKey;
  let product = stripeSubscriptionProducts[productKey];
  
  console.log(product)
  product = stripeSubscriptionProducts["L1_TEST"];

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

  if (product.mode === "subscription") {
    const agreementVersion = `1.${product_level + 1}.${payment_timeline + 1}`
    await insertSubscriptionAgreementFunction(connection, project_idx, {
      agreement_version: agreementVersion,
      plan_type: productKey,
      full_name_entered: agreement_name,
      email_entered: email,
      stripe_checkout_session_id: session.id,
    });
  }

  return {
    success: true,
    url: session.url,
  };
};

export const sendStripePortalLink = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
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

  return await sendStripePortalLinkFunction(email, currentProject);
};
