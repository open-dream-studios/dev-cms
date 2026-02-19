// // server/handlers/payments/payments_controllers.ts
// import Stripe from "stripe";
// import dotenv from "dotenv";
// import { products } from "../../services/stripe/stripe.js"
// import { FRONTEND_URL } from "config.js";
// import { Request, Response } from "express"
// import { db } from "connection/connect.js";
// import { PoolConnection } from "mysql2/promise";
// import { getUserByIdFunction } from "handlers/auth/auth_repositories.js";
// dotenv.config();

// export const checkoutSession = async (connection: PoolConnection, req: Request, res: Response) => {
//   const token = req.cookies.accessToken
//   if (!token) return res.status(401).json("Not authenticated!");

//   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
//   const { user_id, user_email, user_first_name, user_last_name, product_type } =
//     req.body;

//   if (!Object.keys(products).includes(product_type)) {
//     return res.status(500).json({ error: "Unable to determine payment type" });
//   }
//   const payment_item = products[product_type];

//   try {
//     // Search to see if user has a customer ID
//     const existingUser = getUserByIdFunction(connection, user_id)
//     // const existingUser = await new Promise((resolve, reject) => {
//     //   db.query(
//     //     "SELECT stripe_customer_id FROM users WHERE user_id = ?",
//     //     [user_id],
//     //     (err, data) => {
//     //       if (err) {
//     //         console.error(
//     //           "DB Query Error: Could not fetch Stripe Customer ID",
//     //           err
//     //         );
//     //         return reject(err);
//     //       }
//     //       resolve(data.length > 0 ? data[0].stripe_customer_id : null);
//     //     }
//     //   );
//     // });
//     // let customer = existingUser || null;
//     const existingStripeUser = existingUser ? existingUser.stripe_customer_id : null

//     // Set customer OR Create customer and enter ID into db
//     if (!existingStripeUser) {
//       const newCustomer = await stripe.customers.create({
//         email: user_email,
//         name: `${user_first_name} ${user_last_name}`,
//         metadata: { user_id },
//       });
//       customer = newCustomer.id;

//       await new Promise((resolve, reject) => {
//         db.query(
//           "UPDATE users SET stripe_customer_id = ? WHERE user_id = ?",
//           [customer, user_id],
//           (err, data) => {
//             if (err) {
//               console.error(
//                 "DB Mutation Error: Could not set Stripe Customer ID",
//                 err
//               );
//               return reject(err);
//             }
//             resolve();
//           }
//         );
//       });
//     }

//     if (payment_item.mode === "payment") {
//       const sessionObject = {
//         payment_method_types: ["card"],
//         customer: customer,
//         line_items: [{ price: payment_item.price_id, quantity: 1 }],
//         mode: payment_item.mode,
//         success_url: FRONTEND_URL,
//         cancel_url: FRONTEND_URL,
//         metadata: {
//           user_id,
//           user_email,
//           user_first_name,
//           user_last_name,
//           payment_mode: payment_item.mode,
//           credits: payment_item.credits,
//         },
//         payment_intent_data: {
//           metadata: {
//             user_id,
//             user_email,
//             user_first_name,
//             user_last_name,
//             payment_mode: payment_item.mode,
//             credits: payment_item.credits,
//           },
//         },
//       };
//       const session = await stripe.checkout.sessions.create(sessionObject);
//       return res.json({ url: session.url });
//     } else if (payment_item.mode === "subscription") {
//       const sessionObject = {
//         payment_method_types: ["card"],
//         customer: customer,
//         line_items: [{ price: payment_item.price_id, quantity: 1 }],
//         mode: payment_item.mode,
//         success_url: FRONTEND_URL,
//         cancel_url: FRONTEND_URL,
//         metadata: {
//           user_id,
//           user_email,
//           user_first_name,
//           user_last_name,
//           payment_mode: payment_item.mode,
//         },
//         subscription_data: {
//           metadata: {
//             user_id,
//             user_email,
//             user_first_name,
//             user_last_name,
//             payment_mode: payment_item.mode,
//           },
//         },
//       };
//       const session = await stripe.checkout.sessions.create(sessionObject);
//       return res.json({ url: session.url });
//     }
//   } catch (error) {
//     console.log(error.message);
//     return res
//       .status(500)
//       .json({ error: "Failed to create checkout session. Please try again." });
//   }
// };

// export const customerPortalSession = async (connection: PoolConnection, req: Request, res: Response) => {
//   const token = req.cookies.accessToken
//   if (!token) return res.status(401).json("Not authenticated!");

//   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
//   const { user_id } = req.body;

//   try {
//     const existingUser = await new Promise((resolve, reject) => {
//       db.query(
//         "SELECT stripe_customer_id FROM users WHERE user_id = ?",
//         [user_id],
//         (err, data) => {
//           if (err) {
//             console.error("DB Query Error:", err);
//             return reject(err);
//           }
//           resolve(data.length > 0 ? data[0].stripe_customer_id : null);
//         }
//       );
//     });

//     if (!existingUser) {
//       return res.status(400).json({
//         message: "No Stripe purchases have been attached to your account",
//       });
//     }

//     // Create a Customer Portal session
//     const portalSession = await stripe.billingPortal.sessions.create({
//       customer: existingUser,
//       return_url: FRONTEND_URL,
//     });

//     return res.json({ url: portalSession.url });
//   } catch (error) {
//     console.error("Stripe Portal Error:", error);
//     return res.status(500).json({ message: "Unable to create portal session" });
//   }
// };

// export const customerUpdateSubscription = async (connection: PoolConnection, req: Request, res: Response) => {
//   const token = req.cookies.accessToken
//   if (!token) return res.status(401).json("Not authenticated!");

//   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
//   const { user_id, product_type } = req.body;
//   if (!Object.keys(products).includes(product_type)) {
//     return res.status(500).json({ error: "Unable to determine payment type" });
//   }

//   try {
//     // Search to see if user has a customer ID
//     const currentUser = await new Promise((resolve, reject) => {
//       db.query(
//         "SELECT * FROM users WHERE user_id = ?",
//         [user_id],
//         (err, data) => {
//           if (err) {
//             console.error(
//               "DB Query Error: Could not fetch subscription ID",
//               err
//             );
//             return reject(err);
//           }
//           resolve(data.length > 0 ? data[0] : null);
//         }
//       );
//     });

//     let currentUserSubId = null;
//     if (currentUser && currentUser.stripe_customer_id) {
//       const subscriptions = await stripe.subscriptions.list({
//         customer: currentUser.stripe_customer_id,
//         limit: 1,
//         status: "active",
//       });

//       if (subscriptions.data.length > 0) {
//         currentUserSubId = subscriptions.data[0].id;
//       }

//       if (currentUserSubId) {
//         const subscription = await stripe.subscriptions.retrieve(
//           currentUserSubId
//         );
//         const subscriptionItemId = subscription.items.data[0].id;

//         // Get the current product type
//         const current_price_id = subscription.plan?.id;
//         const current_product_type = Object.keys(products).find(
//           (key) => products[key].price_id === current_price_id
//         );

//         const current_timeline = current_product_type.split("_L")[0];
//         const current_level = current_product_type.split("_L")[1];
//         const incoming_timeline = product_type.split("_L")[0];
//         const incoming_level = product_type.split("_L")[1];

//         let upgrade = null;

//         if (current_product_type === product_type) {
//           if (subscription.schedule) {
//             await stripe.subscriptionSchedules.release(subscription.schedule);
//           }
//           return res.status(200).json({
//             success: true,
//             message: "Your subscription will remain unchanged",
//           });
//         }

//         if (current_timeline === "1M" && incoming_timeline === "1Y") {
//           upgrade = true;
//         } else if (current_timeline === "1Y" && incoming_timeline === "1M") {
//           upgrade = false;
//         } else {
//           if (current_level < incoming_level) {
//             upgrade = true;
//           } else if (current_level > incoming_level) {
//             upgrade = false;
//           } else {
//             return res.status(200).json({
//               success: false,
//               message: "Error changing subscription",
//             });
//           }
//         }

//         if (upgrade === true) {
//           // Release any downgrade schedules
//           if (subscription.schedule) {
//             await stripe.subscriptionSchedules.release(subscription.schedule);
//           }
//           await stripe.subscriptions.update(currentUserSubId, {
//             items: [
//               {
//                 id: subscriptionItemId,
//                 deleted: true,
//               },
//               {
//                 price: products[product_type].price_id,
//               },
//             ],
//             proration_behavior: "create_prorations",
//             billing_cycle_anchor: "now",
//             expand: ["latest_invoice.payment_intent"],
//           });
//           return res.status(200).json({
//             success: true,
//             message: "Subscription upgraded",
//           });
//         } else if (upgrade === false) {
//           const createSchedule = async (currentUserSubId, upcomingPriceId) => {
//             const schedule = await stripe.subscriptionSchedules.create({
//               from_subscription: currentUserSubId,
//             });
//             const currentPhase = schedule.phases[0];
//             await stripe.subscriptionSchedules.update(schedule.id, {
//               phases: [
//                 {
//                   items: [{ price: currentPhase.items[0].price, quantity: 1 }],
//                   start_date: currentPhase.start_date,
//                   end_date: currentPhase.end_date,
//                   proration_behavior: "none",
//                 },
//                 {
//                   items: [{ price: upcomingPriceId, quantity: 1 }],
//                   proration_behavior: "none",
//                   iterations: 1,
//                 },
//               ],
//             });
//           };

//           const updateSchedule = async (
//             schedule,
//             upcomingPriceId
//           ) => {
//             const currentPhase = schedule.phases[0];
//             await stripe.subscriptionSchedules.update(schedule.id, {
//               phases: [
//                 {
//                   items: [{ price: currentPhase.items[0].price, quantity: 1 }],
//                   start_date: currentPhase.start_date,
//                   end_date: currentPhase.end_date,
//                   proration_behavior: "none",
//                 },
//                 {
//                   items: [{ price: upcomingPriceId, quantity: 1 }],
//                   proration_behavior: "none",
//                   iterations: 1,
//                 },
//               ],
//             });
//           };

//           if (subscription.schedule) {
//             // Already has a downgrade schedule
//             const schedule = await stripe.subscriptionSchedules.retrieve(
//               subscription.schedule
//             );

//             // If the user requested the same downgrade again
//             if (
//               schedule.phases[1].items[0].price ===
//               products[product_type].price_id
//             ) {
//               return res.status(200).json({
//                 success: false,
//                 message:
//                   "Already scheduled to downgrade to this subscription at the start of the next billing cycle",
//               });
//             } else {
//               updateSchedule(
//                 schedule,
//                 products[product_type].price_id
//               );
//               return res.status(200).json({
//                 success: true,
//                 message:
//                   "Downgrade is scheduled for the start of the next billing cycle",
//               });
//             }
//           } else {
//             // Create a downgrade schedule
//             await createSchedule(
//               currentUserSubId,
//               products[product_type].price_id
//             );
//             return res.status(200).json({
//               success: true,
//               message:
//                 "Downgrade is scheduled for the start of the next billing cycle",
//             });
//           }
//         } else {
//           return res.status(500).json({
//             success: false,
//             message: "Invalid upgrade type",
//           });
//         }
//       } else {
//         return res
//           .status(404)
//           .json({ success: false, message: "Could not find current subscription" });
//       }
//     } else {
//       return res
//         .status(404)
//         .json({ success: false, message: "Could not find current subscription" });
//     }
//   } catch (error) {
//     console.log(error);
//     return res
//       .status(500)
//       .json({ success: false, message: "Could not update current subscription" });
//   }
// };
