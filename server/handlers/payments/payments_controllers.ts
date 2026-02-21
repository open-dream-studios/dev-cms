// server/handlers/payments/payments_controllers.ts
import Stripe from "stripe";
import dotenv from "dotenv";
import { FRONTEND_URL } from "../../config.js";
import { Request, Response } from "express";
import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import {
  getUserByIdFunction,
  getUserByUserIdFunction,
} from "../auth/auth_repositories.js";
import { StripeProductKey, stripeProducts } from "@open-dream/shared";
dotenv.config();

export const checkoutSession = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const { product_type } = req.body;

  const userId = req.user?.user_id;
  if (!userId) return { success: false };
  const user = await getUserByUserIdFunction(connection, userId);
  if (!user) return { success: false };
  const firstName = user.first_name;
  const lastName = user.last_name;
  const email = user.email;
  if (!firstName || !lastName || !email) return { success: false };

  if (!Object.keys(stripeProducts).includes(product_type)) {
    return { success: false, message: "Unable to determine payment type" };
  }
  const payment_item = stripeProducts[product_type as StripeProductKey];
  let stripe_customer_id = user ? user.stripe_customer_id : null;

  // Set customer OR Create customer and enter ID into db
  if (!stripe_customer_id) {
    const newCustomer = await stripe.customers.create({
      email,
      name: `${firstName} ${lastName}`,
      metadata: { user_id: userId },
    });
    stripe_customer_id = newCustomer.id;
    const query = "UPDATE users SET stripe_customer_id = ? WHERE user_id = ?";
    const values = [stripe_customer_id, userId];
    await connection.query<ResultSetHeader>(query, values);
  }

  if (payment_item.mode === "payment") {
    const sessionObject: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      customer: stripe_customer_id,
      line_items: [{ price: payment_item.price_id, quantity: 1 }],
      mode: payment_item.mode,
      success_url: FRONTEND_URL,
      cancel_url: FRONTEND_URL,
      metadata: {
        user_id: userId,
        user_email: email,
        user_first_name: firstName,
        user_last_name: lastName,
        payment_mode: payment_item.mode,
        credits: payment_item.credits,
      },
      payment_intent_data: {
        metadata: {
          user_id: userId,
          user_email: email,
          user_first_name: firstName,
          user_last_name: lastName,
          payment_mode: payment_item.mode,
          credits: payment_item.credits,
        },
      },
    };
    const session = await stripe.checkout.sessions.create(sessionObject);
    return { success: true, url: session.url };
  } else if (payment_item.mode === "subscription") {
    const sessionObject: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      customer: stripe_customer_id,
      line_items: [{ price: payment_item.price_id, quantity: 1 }],
      mode: payment_item.mode,
      success_url: FRONTEND_URL,
      cancel_url: FRONTEND_URL,
      metadata: {
        user_id: userId,
        user_email: email,
        user_first_name: firstName,
        user_last_name: lastName,
        payment_mode: payment_item.mode,
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          user_email: email,
          user_first_name: firstName,
          user_last_name: lastName,
          payment_mode: payment_item.mode,
        },
      },
    };
    const session = await stripe.checkout.sessions.create(sessionObject);
    return { success: true, url: session.url };
  }
};

export const customerPortalSession = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const userId = req.user?.user_id;
  if (!userId) return { success: false };

  const existingUser = await getUserByUserIdFunction(connection, userId);
  if (!existingUser || !existingUser.stripe_customer_id) {
    return {
      success: false,
      message: "No Stripe purchases have been attached to your account",
    };
  }
  // Create a Customer Portal session
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: existingUser.stripe_customer_id,
    return_url: FRONTEND_URL,
  });

  return { success: true, url: portalSession.url };
};

export const customerUpdateSubscription = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const { product_type } = req.body;
  const userId = req.user?.user_id;
  if (!userId) return { success: false };

  if (!Object.keys(stripeProducts).includes(product_type)) {
    return {
      success: false,
      message: "Unable to determine payment type",
    };
  }

  // Search to see if user has a customer ID
  const currentUser = await getUserByUserIdFunction(connection, userId);

  let currentUserSubId = null;
  if (currentUser && currentUser.stripe_customer_id) {
    const subscriptions = await stripe.subscriptions.list({
      customer: currentUser.stripe_customer_id,
      limit: 1,
      status: "active",
    });

    if (subscriptions.data.length > 0) {
      currentUserSubId = subscriptions.data[0].id;
    }

    if (currentUserSubId) {
      // const subscription = await stripe.subscriptions.retrieve(
      //   currentUserSubId
      // );
      const subscriptionResponse = await stripe.subscriptions.retrieve(
        currentUserSubId
      );
      const subscription = subscriptionResponse as Stripe.Subscription;

      const subscriptionItemId = subscription.items.data[0].id;
      // Get the current product type
      // const current_price_id = subscription.plan?.id;
      const current_price_id = subscription.items.data[0]?.price?.id ?? null;

      const current_product_type = Object.keys(stripeProducts).find(
        (key) =>
          stripeProducts[key as StripeProductKey].price_id === current_price_id
      );

      const current_timeline = current_product_type
        ? current_product_type.split("_L")[0]
        : null;
      const current_level = current_product_type
        ? current_product_type.split("_L")[1]
        : null;
      const incoming_timeline = product_type.split("_L")[0];
      const incoming_level = product_type.split("_L")[1];

      let upgrade = null;

      const scheduleId =
        typeof subscription.schedule === "string"
          ? subscription.schedule
          : subscription.schedule?.id;

      if (current_product_type === product_type) {
        if (scheduleId) {
          await stripe.subscriptionSchedules.release(scheduleId);
        }
        return {
          success: true,
          message: "Your subscription will remain unchanged",
        };
      }

      if (!current_timeline || !current_level)
        return {
          success: false,
          message: "No timeline or current level found",
        };
      if (current_timeline === "1M" && incoming_timeline === "1Y") {
        upgrade = true;
      } else if (current_timeline === "1Y" && incoming_timeline === "1M") {
        upgrade = false;
      } else {
        if (current_level < incoming_level) {
          upgrade = true;
        } else if (current_level > incoming_level) {
          upgrade = false;
        } else {
          return {
            success: false,
            message: "Error changing subscription",
          };
        }
      }

      if (upgrade === true) {
        // Release any downgrade schedules
        if (scheduleId) {
          await stripe.subscriptionSchedules.release(scheduleId);
        }
        await stripe.subscriptions.update(currentUserSubId, {
          items: [
            {
              id: subscriptionItemId,
              deleted: true,
            },
            {
              price: stripeProducts[product_type as StripeProductKey].price_id,
            },
          ],
          proration_behavior: "create_prorations",
          billing_cycle_anchor: "now",
          expand: ["latest_invoice.payment_intent"],
        });
        return {
          success: true,
          message: "Subscription upgraded",
        };
      } else if (upgrade === false) {
        const createSchedule = async (
          currentUserSubId: string,
          upcomingPriceId: string
        ) => {
          const schedule = await stripe.subscriptionSchedules.create({
            from_subscription: currentUserSubId,
          });
          const currentPhase = schedule.phases[0];
          await stripe.subscriptionSchedules.update(schedule.id, {
            phases: [
              {
                // items: [{ price: currentPhase.items[0].price, quantity: 1 }],
                items: [
                  {
                    price:
                      typeof currentPhase.items[0].price === "string"
                        ? currentPhase.items[0].price
                        : currentPhase.items[0].price?.id,
                    quantity: 1,
                  },
                ],
                start_date: currentPhase.start_date,
                end_date: currentPhase.end_date,
                proration_behavior: "none",
              },
              {
                items: [{ price: upcomingPriceId, quantity: 1 }],
                proration_behavior: "none",
                // iterations: 1,
              },
            ],
          });
        };

        const updateSchedule = async (
          schedule: any,
          upcomingPriceId: string
        ) => {
          const currentPhase = schedule.phases[0];
          await stripe.subscriptionSchedules.update(schedule.id, {
            phases: [
              {
                items: [{ price: currentPhase.items[0].price, quantity: 1 }],
                start_date: currentPhase.start_date,
                end_date: currentPhase.end_date,
                proration_behavior: "none",
              },
              {
                items: [{ price: upcomingPriceId, quantity: 1 }],
                proration_behavior: "none",
                // iterations: 1,
              },
            ],
          });
        };

        if (scheduleId) {
          // Already has a downgrade schedule
          const schedule = await stripe.subscriptionSchedules.retrieve(
            scheduleId
          );

          // If the user requested the same downgrade again
          if (
            schedule.phases[1].items[0].price ===
            stripeProducts[product_type as StripeProductKey].price_id
          ) {
            return {
              success: false,
              message:
                "Already scheduled to downgrade to this subscription at the start of the next billing cycle",
            };
          } else {
            updateSchedule(
              schedule,
              stripeProducts[product_type as StripeProductKey].price_id
            );
            return {
              success: true,
              message:
                "Downgrade is scheduled for the start of the next billing cycle",
            };
          }
        } else {
          // Create a downgrade schedule
          await createSchedule(
            currentUserSubId,
            stripeProducts[product_type as StripeProductKey].price_id
          );
          return {
            success: true,
            message:
              "Downgrade is scheduled for the start of the next billing cycle",
          };
        }
      } else {
        return {
          success: false,
          message: "Invalid upgrade type",
        };
      }
    } else {
      return {
        success: false,
        message: "Could not find current subscription",
      };
    }
  } else {
    return {
      success: false,
      message: "Could not find current subscription",
    };
  }
};
