// server/handlers/public/payments/payments_controllers.ts
import Stripe from "stripe";
import type { PoolConnection } from "mysql2/promise";
import type { Request, Response } from "express";
import {
  stripeSubscriptionProducts,
  StripeProductKey,
  stripeTestProducts,
  StripeTestProductKey,
} from "@open-dream/shared";
import {
  getProjectByIdFunction,
  getProjectIdByDomain,
} from "../../projects/projects_repositories.js";
import { changeToHTTPSDomain } from "../../../functions/data.js";
import { getProjectDomainFromWixRequest } from "../../../util/verifyWixRequest.js";
import { sendStripePortalLinkFunction } from "./payments_repositories.js";
import { insertSubscriptionAgreementFunction } from "../../payments/agreements/agreements_repositories.js";

export const getStripeCheckoutLink = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
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
    product_type,
    payment_timeline,
    day_instance,
    selected_day,
    selected_slot,
    customer,
    agreement_name,
    test_checkout,
  } = req.body as {
    return_page: string;
    product_level: number;
    product_type: "subscription" | "1X";
    payment_timeline: number;
    day_instance: number;
    selected_day: number;
    selected_slot: number;
    customer: any;
    agreement_name: string;
    test_checkout: boolean;
  };

  if (
    day_instance == null ||
    selected_day == null ||
    selected_slot == null ||
    customer == null ||
    product_level == null ||
    product_type == null ||
    payment_timeline == null ||
    agreement_name == null ||
    test_checkout == null
  ) {
    return { success: false, message: "Missing required fields" };
  }

  const stripe = test_checkout
    ? new Stripe(process.env.STRIPE_TEST_SECRET_KEY!)
    : new Stripe(process.env.STRIPE_SECRET_KEY!);
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

  const validProductLevels = [0, 1, 2];
  const validPaymentTimelines = [0, 1, 2];

  if (!validProductLevels.includes(product_level)) {
    return { success: false, message: "Invalid product level" };
  }
  if (!validPaymentTimelines.includes(payment_timeline)) {
    return { success: false, message: "Invalid payment timeline" };
  }

  let product = null;
  let productKey = null;
  if (test_checkout) {
    // TEST
    productKey = `L1_${
      product_type === "subscription" ? "TEST" : "1X_TEST"
    }` as StripeTestProductKey;
    if (!Object.keys(stripeTestProducts).includes(productKey)) {
      return { success: false, message: "Stripe test product not found" };
    }
    product = stripeTestProducts[productKey];
  } else {
    // LIVE
    productKey = `L${product_level + 1}_${
      payment_timeline === 0 ? "1M" : payment_timeline === 1 ? "6M" : "1Y"
    }` as StripeProductKey;
    if (!Object.keys(stripeSubscriptionProducts).includes(productKey)) {
      return { success: false, message: "Stripe product not found" };
    }
    product = stripeSubscriptionProducts[productKey];
  }

  // DUMMY LIVE SUBSCRIPTION
  // console.log(product)
  if (first_name === "L1_TEST") { 
    product = stripeSubscriptionProducts["L1_TEST"];
  }

  if (!product) return { success: false, message: "Product not found" };

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

  const metadata = {
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
  };
 
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

      metadata: metadata,

      // 🔑 REQUIRED for subscriptions
      ...(product.mode === "subscription" && {
        subscription_data: {
          metadata: metadata,
        },
      }),
    });

  if (product.mode === "subscription") {
    const agreementVersion = `1.${product_level + 1}.${payment_timeline + 1}`;
    await insertSubscriptionAgreementFunction(connection, project_idx, {
      agreement_version: agreementVersion,
      plan_type: productKey,
      full_name_entered: agreement_name,
      email_entered: email,
      stripe_checkout_session_id: session.id,
      test: test_checkout
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
