// server/handlers/public/payments/payments/repositories.ts 
import Stripe from "stripe";
import { changeToHTTPSDomain } from "../../../functions/data.js";
import {
  appDetailsProjectByDomain,
  manageSubscriptionEmail,
  normalizeDomain,
  Project,
} from "@open-dream/shared";
import {
  getGmailClient,
  getGmailKeys,
  sendGmail,
} from "../../../services/google/gmail/gmail.js";

export const sendStripePortalLinkFunction = async (
  email: string,
  project: Project
) => {
  if (!project.domain) {
    console.log("⚠️ Portal Email Failed ", "No project domain");
    return { success: true };
  }
  if (!project.id) {
    console.log("⚠️ Portal Email Failed ", "No project id");
    return { success: true };
  }
  if (!project.backend_domain) {
    console.log("⚠️ Portal Email Failed ", "No project backend domain");
    return { success: true };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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
    return_url: changeToHTTPSDomain(project.domain),
  });

  const decryptedKeys = await getGmailKeys(project.id);

  if (
    decryptedKeys?.GOOGLE_CLIENT_SECRET_OBJECT &&
    decryptedKeys?.GOOGLE_REFRESH_TOKEN_OBJECT
  ) {
    const gmailClient = await getGmailClient(
      decryptedKeys.GOOGLE_CLIENT_SECRET_OBJECT,
      decryptedKeys.GOOGLE_REFRESH_TOKEN_OBJECT
    );

    const foundProject = appDetailsProjectByDomain(
      normalizeDomain(project.backend_domain)
    );
    if (!foundProject || !foundProject.email_config) {
      console.log("⚠️ Portal Email Failed ", "Project details not found");
      return { success: true };
    }

    const config = foundProject.email_config;

    const body = manageSubscriptionEmail({
      businessName: config.businessName,
      customerName: customer.name ?? null,
      logoUrl: config.logoUrl,
      manageSubscriptionUrl: portalSession.url,
      getNewLinkPage: changeToHTTPSDomain(project.domain),
      primaryColor: config.primaryColor,
      phoneNumber: config.phoneNumber,
    });

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
