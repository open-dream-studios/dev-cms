// server/services/stripe/transactions.ts
import Stripe from "stripe";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { db } from "connection/connect.js";
import { getIO } from "connection/websocket.js";
import { formatStripeDateForMySQL } from "functions/data.js";
import { getUserByIdFunction } from "handlers/auth/auth_repositories.js";
import { PoolConnection } from "mysql2/promise";
import { Response } from "express"
dotenv.config();

export const handle1XCheckoutTransaction = async (event: any, res: Response) => {
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const session = event.data.object;

  // // Declare stripe variables directly from session
  // const stripe_session_payment_intent =
  //   event.type === "checkout.session.completed"
  //     ? session.payment_intent
  //     : session.id;
  // const stripe_session_id =
  //   event.type === "checkout.session.completed" ? session.id : null;
  // const stripe_customer_id = session.customer;
  // const stripe_payment_mode = session.mode;
  // const stripe_amount =
  //   event.type === "checkout.session.completed"
  //     ? session.amount_total
  //     : session.amount;
  // const stripe_currency = session.currency;
  // const stripe_latest_payment_status =
  //   event.type === "checkout.session.completed"
  //     ? session.payment_status
  //     : "failed";
  // let stripe_latest_payment_message =
  //   event.type === "checkout.session.completed"
  //     ? "Successful Transaction"
  //     : session.last_payment_error?.message;
  // let stripe_latest_payment_method = null;
  // let stripe_latest_charge = null;
  // const stripe_created_at = session.created;

  // try {
  //   if (event.type === "checkout.session.completed") {
  //     if (session.payment_intent) {
  //       const paymentIntent = await stripe.paymentIntents.retrieve(
  //         session.payment_intent
  //       );
  //       stripe_latest_payment_method = paymentIntent.payment_method;
  //       stripe_latest_charge = paymentIntent.latest_charge;
  //     }
  //   } else {
  //     stripe_latest_payment_method =
  //       session.last_payment_error?.payment_method?.id;
  //     stripe_latest_charge = session.last_payment_error?.charge;
  //   }
  // } catch (err) {
  //   console.error(err);
  // }

  // const stripe_payment_log = JSON.stringify([
  //   {
  //     time: stripe_created_at,
  //     type: stripe_latest_payment_status,
  //     message: stripe_latest_payment_message,
  //     stripe_latest_payment_method: stripe_latest_payment_method,
  //     stripe_latest_charge: stripe_latest_charge,
  //   },
  // ]);

  // // Collect meta data from front end
  // const {
  //   user_id,
  //   user_email,
  //   user_first_name,
  //   user_last_name,
  //   payment_mode,
  //   credits,
  // } =
  //   Object.keys(session.metadata).length > 0
  //     ? session.metadata
  //     : {
  //         user_id: null,
  //         user_email: null,
  //         user_first_name: null,
  //         user_last_name: null,
  //         payment_mode: null,
  //         credits: 0,
  //       };

  // if (event.type === "checkout.session.completed") {
  //   try {
  //     await updateUserCredits(credits, user_id);
  //   } catch (error) {
  //     console.error(error)
  //   }
  // }

  // // Send confirmation email on successful payment
  // if (event.type === "checkout.session.completed") {
  //   const transporter = nodemailer.createTransport({
  //     service: "gmail",
  //     auth: {
  //       user: process.env.NODE_MAILER_ORIGIN,
  //       pass: process.env.NODE_MAILER_PASSKEY,
  //     },
  //   });
  //   try {
  //     await transporter.sendMail({
  //       from: process.env.NODE_MAILER_ORIGIN,
  //       to: user_email,
  //       subject: "Payment Confirmation",
  //       text: `Your payment has been confirmed!`,
  //     });
  //   } catch (error) {
  //     console.error("Error sending confirmation email: ", error);
  //   }
  // }

  // // Enter transaction into the database
  // try {
  //   const user = await new Promise((resolve, reject) => {
  //     db.query(
  //       "SELECT * FROM users WHERE user_id = ?",
  //       [user_id],
  //       (err, data) => {
  //         if (err) {
  //           console.error(
  //             "DB Query Error: Could not fetch Stripe Customer ID",
  //             err
  //           );
  //           return reject(err);
  //         }
  //         resolve(data.length > 0 ? data[0] : null);
  //       }
  //     );
  //   });
  //   if (!user) return

  //   const transaction = await new Promise((resolve, reject) => {
  //     db.query(
  //       "SELECT * FROM transactions WHERE stripe_session_payment_intent = ?",
  //       [stripe_session_payment_intent],
  //       (err, data) => {
  //         if (err) {
  //           console.error(
  //             "DB Query Error: Could not fetch existing transaction",
  //             err
  //           );
  //           return reject(-1);
  //         }
  //         resolve(data.length > 0 ? data[0] : null);
  //       }
  //     );
  //   });
  //   if (!transaction) {
  //     await new Promise((resolve, reject) => {
  //       db.query(
  //         "INSERT INTO transactions (`stripe_session_payment_intent`, `stripe_session_id`, `stripe_customer_id`, `stripe_payment_mode`, `stripe_amount`, `stripe_currency`, `stripe_created_at`, `stripe_latest_payment_status`, `stripe_latest_payment_message`, `stripe_latest_payment_method`, `stripe_latest_charge`, `stripe_payment_log`, `user_id`, `user_email`, `user_first_name`, `user_last_name`, `payment_mode`) VALUES (?)",
  //         [
  //           [
  //             stripe_session_payment_intent,
  //             stripe_session_id,
  //             stripe_customer_id,
  //             stripe_payment_mode,
  //             stripe_amount,
  //             stripe_currency,
  //             stripe_created_at,
  //             stripe_latest_payment_status,
  //             stripe_latest_payment_message,
  //             stripe_latest_payment_method,
  //             stripe_latest_charge,
  //             stripe_payment_log,
  //             user_id,
  //             user_email,
  //             user_first_name,
  //             user_last_name,
  //             payment_mode,
  //           ],
  //         ],
  //         (err, data) => {
  //           if (err) {
  //             console.error(
  //               "DB Mutation Error: Could not insert transaction",
  //               err
  //             );
  //             return reject(err);
  //           }
  //           resolve(true);
  //         }
  //       );
  //     });
  //   } else {
  //     const updated_log = transaction.stripe_payment_log;
  //     updated_log.push(JSON.parse(stripe_payment_log)[0]);

  //     await new Promise((resolve, reject) => {
  //       db.query(
  //         "UPDATE transactions SET `stripe_session_id`=?, `stripe_payment_mode`=?, `stripe_amount`=?, `stripe_latest_payment_status`=?, `stripe_latest_payment_message`=?, `stripe_latest_payment_method`=?, `stripe_latest_charge`=?, `stripe_payment_log`=? WHERE stripe_session_payment_intent=?",
  //         [
  //           stripe_session_id,
  //           stripe_payment_mode,
  //           stripe_amount,
  //           stripe_latest_payment_status,
  //           stripe_latest_payment_message,
  //           stripe_latest_payment_method,
  //           stripe_latest_charge,
  //           JSON.stringify(updated_log),
  //           stripe_session_payment_intent,
  //         ],
  //         (err, data) => {
  //           if (err) {
  //             console.error(
  //               "DB Query Error: Could not update existing transaction",
  //               err
  //             );
  //             return reject(err);
  //           }
  //           resolve(true);
  //         }
  //       );
  //     });
  //   }
  //   getIO().emit("update-user");
  // } catch (err) {
  //   console.error("Database error:", err);
  //   return
  // }
};

export const handleSubscriptionCheckoutTransaction = async (
  event: any,
  res: any,
  metadata: any,
  invoice: any
) => {
  // const session = event.data.object;
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // // Declare stripe variables directly from session
  // const stripe_invoice_id = session.invoice;
  // let stripe_invoice_number = null;
  // const stripe_invoice_type = invoice.billing_reason
  // const stripe_subscription_id =
  //   event.type === "checkout.session.completed" ? session.subscription : null;
  // const stripe_customer_id = session.customer;
  // const stripe_payment_mode =
  //   event.type === "checkout.session.completed" ? session.mode : null;
  // const stripe_amount =
  //   event.type === "checkout.session.completed"
  //     ? session.amount_total
  //     : session.amount;
  // const stripe_currency = session.currency;
  // let stripe_invoice_status = null;
  // let stripe_subscription_status = null;
  // let stripe_latest_payment_status =
  //   event.type === "checkout.session.completed"
  //     ? session.payment_status
  //     : "failed";
  // let stripe_latest_payment_method = null;
  // let stripe_latest_charge = null;
  // const stripe_latest_payment_message =
  //   event.type === "checkout.session.completed"
  //     ? "Successful Transaction"
  //     : session.last_payment_error?.message;
  // let stripe_current_period_start = null;
  // let stripe_current_period_end = null;
  // const stripe_created_at = session.created;

  // try {
  //   if (event.type === "checkout.session.completed") {
  //     const subscription = await stripe.subscriptions.retrieve(
  //       session.subscription
  //     );
  //     const invoice = await stripe.invoices.retrieve(
  //       subscription.latest_invoice
  //     );
  //     if (invoice.charge) {
  //       const charge = await stripe.charges.retrieve(invoice.charge);
  //       const paymentMethod = charge.payment_method;

  //       stripe_latest_payment_method = paymentMethod;
  //       stripe_latest_charge = charge.id;
  //     }
  //   } else {
  //     stripe_latest_payment_method =
  //       session.last_payment_error?.payment_method?.id;
  //     stripe_latest_charge = session.last_payment_error?.charge;
  //   }
  // } catch (error) {
  //   console.error("Error fetching Stripe details:", error);
  // }

  // try {
  //   if (stripe_invoice_id) {
  //     const invoice = await stripe.invoices.retrieve(stripe_invoice_id);
  //     stripe_invoice_status = invoice.status; // "draft", "open", "paid", etc.
  //     stripe_invoice_number = invoice.number;
  //   }

  //   if (stripe_subscription_id) {
  //     const subscription = await stripe.subscriptions.retrieve(
  //       stripe_subscription_id
  //     );
  //     stripe_subscription_status = subscription.status; // "active", "canceled", etc.

  //     stripe_current_period_start = formatStripeDateForMySQL(
  //       subscription.current_period_start
  //     );
  //     stripe_current_period_end = formatStripeDateForMySQL(
  //       subscription.current_period_end
  //     );
  //   }
  // } catch (error) {
  //   console.error("Error fetching Stripe details:", error);
  // }

  // const stripe_payment_log = JSON.stringify([
  //   {
  //     time: stripe_created_at,
  //     type: stripe_latest_payment_status,
  //     message: stripe_latest_payment_message,
  //     stripe_latest_payment_method: stripe_latest_payment_method,
  //     stripe_latest_charge: stripe_latest_charge,
  //   },
  // ]);

  // // Collect meta data from front end
  // const { user_id, user_email, user_first_name, user_last_name, payment_mode } =
  //   Object.keys(metadata).length > 0
  //     ? metadata
  //     : {
  //         user_id: null,
  //         user_email: null,
  //         user_first_name: null,
  //         user_last_name: null,
  //         payment_mode: null,
  //       };

  // // Send confirmation email on successful payment
  // if (event.type === "checkout.session.completed") {
  //   const transporter = nodemailer.createTransport({
  //     service: "gmail",
  //     auth: {
  //       user: process.env.NODE_MAILER_ORIGIN,
  //       pass: process.env.NODE_MAILER_PASSKEY,
  //     },
  //   });
  //   try {
  //     await transporter.sendMail({
  //       from: process.env.NODE_MAILER_ORIGIN,
  //       to: user_email,
  //       subject: "Payment Confirmation",
  //       text: `Your payment has been confirmed!`,
  //     });
  //   } catch (error) {
  //     console.error("Error sending confirmation email: ", error);
  //   }
  // }

  // // Enter transaction into the database
  // try {
  //   const user = await new Promise((resolve, reject) => {
  //     db.query(
  //       "SELECT * FROM users WHERE user_id = ?",
  //       [user_id],
  //       (err, data) => {
  //         if (err) {
  //           console.error(
  //             "DB Query Error: Could not fetch Stripe Customer ID",
  //             err
  //           );
  //           return reject(err);
  //         }
  //         resolve(data.length > 0 ? data[0] : null);
  //       }
  //     );
  //   });
  //   if (!user) {
  //     return
  //   }

  //   const transaction = await new Promise((resolve, reject) => {
  //     db.query(
  //       "SELECT * FROM subscription_transactions WHERE stripe_invoice_id = ?",
  //       [stripe_invoice_id],
  //       (err, data) => {
  //         if (err) {
  //           console.error(
  //             "DB Query Error: Could not fetch existing transaction",
  //             err
  //           );
  //           return reject(-1);
  //         }
  //         resolve(data.length > 0 ? data[0] : null);
  //       }
  //     );
  //   });
  //   if (!transaction) {
  //     await new Promise((resolve, reject) => {
  //       db.query(
  //         "INSERT INTO subscription_transactions (`stripe_invoice_id`, `stripe_invoice_number`, `stripe_invoice_type`, `stripe_subscription_id`, `stripe_customer_id`, `stripe_payment_mode`, `stripe_amount`, `stripe_currency`, `stripe_invoice_status`, `stripe_subscription_status`, `stripe_latest_payment_status`, `stripe_latest_payment_method`, `stripe_latest_charge`, `stripe_latest_payment_message`, `stripe_payment_log`, `stripe_current_period_start`, `stripe_current_period_end`, `stripe_created_at`, `user_id`, `user_email`, `user_first_name`, `user_last_name`, `payment_mode`) VALUES (?)",
  //         [
  //           [
  //             stripe_invoice_id,
  //             stripe_invoice_number,
  //             stripe_invoice_type,
  //             stripe_subscription_id,
  //             stripe_customer_id,
  //             stripe_payment_mode,
  //             stripe_amount,
  //             stripe_currency,
  //             stripe_invoice_status,
  //             stripe_subscription_status,
  //             stripe_latest_payment_status,
  //             stripe_latest_payment_method,
  //             stripe_latest_charge,
  //             stripe_latest_payment_message,
  //             stripe_payment_log,
  //             stripe_current_period_start,
  //             stripe_current_period_end,
  //             stripe_created_at,
  //             user_id,
  //             user_email,
  //             user_first_name,
  //             user_last_name,
  //             payment_mode,
  //           ],
  //         ],
  //         (err, data) => {
  //           if (err) {
  //             console.error(
  //               "DB Mutation Error: Could not insert transaction",
  //               err
  //             );
  //             return reject(err);
  //           }
  //           resolve(true);
  //         }
  //       );
  //     });
  //   } else {
  //     const updated_log = transaction.stripe_payment_log;
  //     updated_log.push(JSON.parse(stripe_payment_log)[0]);

  //     await new Promise((resolve, reject) => {
  //       db.query(
  //         "UPDATE subscription_transactions SET `stripe_subscription_id`=?, `stripe_payment_mode`=?, `stripe_amount`=?, `stripe_invoice_status`=?, `stripe_subscription_status`=?, `stripe_latest_payment_status`=?, `stripe_latest_payment_method`=?, `stripe_latest_charge`=?, `stripe_latest_payment_message`=?, `stripe_payment_log`=?, `stripe_current_period_start`=?, `stripe_current_period_end`=? WHERE stripe_invoice_id=?",
  //         [
  //           stripe_subscription_id,
  //           stripe_payment_mode,
  //           stripe_amount,
  //           stripe_invoice_status,
  //           stripe_subscription_status,
  //           stripe_latest_payment_status,
  //           stripe_latest_payment_method,
  //           stripe_latest_charge,
  //           stripe_latest_payment_message,
  //           JSON.stringify(updated_log),
  //           stripe_current_period_start,
  //           stripe_current_period_end,
  //           stripe_invoice_id,
  //         ],
  //         (err, data) => {
  //           if (err) {
  //             console.error(
  //               "DB Query Error: Could not update existing transaction",
  //               err
  //             );
  //             return reject(err);
  //           }
  //           resolve(true);
  //         }
  //       );
  //     });
  //   }
  //   getIO().emit("update-user");
  // } catch (err) {
  //   console.error("Database error:", err);
  //   return
  // }
};

export const handleSubscriptionRenewal = async (
  event: any,
  res: any,
  metadata: any,
  subscription: any,
  invoice: any
) => {
  // const session = event.data.object;
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // // Declare stripe variables directly from session
  // const stripe_invoice_id = session.id;
  // const stripe_invoice_number = session.number;
  // const stripe_invoice_type = invoice.billing_reason;
  // const stripe_subscription_id = session.subscription;
  // const stripe_customer_id = session.customer;
  // const stripe_payment_mode = "subscription";
  // const stripe_amount = session.amount_due;
  // const stripe_currency = session.currency;
  // let stripe_invoice_status = session.status;
  // let stripe_subscription_status = null;
  // let stripe_latest_payment_status =
  //   event.type === "invoice.payment_succeeded" ? "paid" : "failed";
  // let stripe_latest_payment_message = null;
  // let stripe_latest_payment_method = null;
  // const stripe_latest_charge = session.charge;
  // let stripe_current_period_start = null;
  // let stripe_current_period_end = null;
  // const stripe_created_at = session.created;

  // try {
  //   if (stripe_subscription_id) {
  //     stripe_subscription_status = subscription.status; // "active", "canceled", etc.

  //     stripe_current_period_start = formatStripeDateForMySQL(
  //       subscription.current_period_start
  //     );
  //     stripe_current_period_end = formatStripeDateForMySQL(
  //       subscription.current_period_end
  //     );
  //   }

  //   const paymentIntent = await stripe.paymentIntents.retrieve(
  //     session.payment_intent
  //   );

  //   if (event.type === "invoice.payment_failed") {
  //     stripe_latest_payment_method =
  //       paymentIntent.last_payment_error?.payment_method?.id;
  //     stripe_latest_payment_message =
  //       paymentIntent.last_payment_error?.message || "Payment Failed";
  //   } else {
  //     stripe_latest_payment_method = paymentIntent.payment_method;
  //     stripe_latest_payment_message = "Successful Transaction";
  //   }
  // } catch (error) {
  //   console.error("Error fetching Stripe details:", error);
  // }

  // const stripe_payment_log = JSON.stringify([
  //   {
  //     time: stripe_created_at,
  //     type: stripe_latest_payment_status,
  //     message: stripe_latest_payment_message,
  //     stripe_latest_payment_method: stripe_latest_payment_method,
  //     stripe_latest_charge: stripe_latest_charge,
  //   },
  // ]);

  // // Collect meta data from front end

  // const { user_id, user_email, user_first_name, user_last_name, payment_mode } =
  //   Object.keys(metadata).length > 0
  //     ? metadata
  //     : {
  //         user_id: null,
  //         user_email: null,
  //         user_first_name: null,
  //         user_last_name: null,
  //         payment_mode: null,
  //       };

  // // Send confirmation email on successful payment
  // if (event.type === "invoice.payment_succeeded") {
  //   const transporter = nodemailer.createTransport({
  //     service: "gmail",
  //     auth: {
  //       user: process.env.NODE_MAILER_ORIGIN,
  //       pass: process.env.NODE_MAILER_PASSKEY,
  //     },
  //   });
  //   try {
  //     await transporter.sendMail({
  //       from: process.env.NODE_MAILER_ORIGIN,
  //       to: user_email,
  //       subject: "Payment Confirmation",
  //       text: `Your payment has been confirmed!`,
  //     });
  //   } catch (error) {
  //     console.error("Error sending confirmation email: ", error);
  //   }
  // }

  // // Enter transaction into the database
  // try {
  //   const user = await new Promise((resolve, reject) => {
  //     db.query(
  //       "SELECT * FROM users WHERE user_id = ?",
  //       [user_id],
  //       (err, data) => {
  //         if (err) {
  //           console.error(
  //             "DB Query Error: Could not fetch Stripe Customer ID",
  //             err
  //           );
  //           return reject(err);
  //         }
  //         resolve(data.length > 0 ? data[0] : null);
  //       }
  //     );
  //   });
  //   if (!user) return 

  //   const transaction = await new Promise((resolve, reject) => {
  //     db.query(
  //       "SELECT * FROM subscription_transactions WHERE stripe_invoice_id = ?",
  //       [stripe_invoice_id],
  //       (err, data) => {
  //         if (err) {
  //           console.error(
  //             "DB Query Error: Could not fetch existing transaction",
  //             err
  //           );
  //           return reject(-1);
  //         }
  //         resolve(data.length > 0 ? data[0] : null);
  //       }
  //     );
  //   });
  //   if (!transaction) {
  //     await new Promise((resolve, reject) => {
  //       db.query(
  //         "INSERT INTO subscription_transactions (`stripe_invoice_id`, `stripe_invoice_number`, `stripe_invoice_type`, `stripe_subscription_id`, `stripe_customer_id`, `stripe_payment_mode`, `stripe_amount`, `stripe_currency`, `stripe_invoice_status`, `stripe_subscription_status`, `stripe_latest_payment_status`, `stripe_latest_payment_method`, `stripe_latest_charge`, `stripe_latest_payment_message`, `stripe_payment_log`, `stripe_current_period_start`, `stripe_current_period_end`, `stripe_created_at`, `user_id`, `user_email`, `user_first_name`, `user_last_name`, `payment_mode`) VALUES (?)",
  //         [
  //           [
  //             stripe_invoice_id,
  //             stripe_invoice_number,
  //             stripe_invoice_type,
  //             stripe_subscription_id,
  //             stripe_customer_id,
  //             stripe_payment_mode,
  //             stripe_amount,
  //             stripe_currency,
  //             stripe_invoice_status,
  //             stripe_subscription_status,
  //             stripe_latest_payment_status,
  //             stripe_latest_payment_method,
  //             stripe_latest_charge,
  //             stripe_latest_payment_message,
  //             stripe_payment_log,
  //             stripe_current_period_start,
  //             stripe_current_period_end,
  //             stripe_created_at,
  //             user_id,
  //             user_email,
  //             user_first_name,
  //             user_last_name,
  //             payment_mode,
  //           ],
  //         ],
  //         (err, data) => {
  //           if (err) {
  //             console.error(
  //               "DB Mutation Error: Could not insert transaction",
  //               err
  //             );
  //             return reject(err);
  //           }
  //           resolve(true);
  //         }
  //       );
  //     });
  //   } else {
  //     const updated_log = transaction.stripe_payment_log;
  //     updated_log.push(JSON.parse(stripe_payment_log)[0]);

  //     await new Promise((resolve, reject) => {
  //       db.query(
  //         "UPDATE subscription_transactions SET `stripe_invoice_status`=?, `stripe_subscription_status`=?, `stripe_latest_payment_status`=?, `stripe_latest_payment_method`=?, `stripe_latest_charge`=?, `stripe_latest_payment_message`=?, `stripe_payment_log`=?, `stripe_current_period_start`=?, `stripe_current_period_end`=? WHERE stripe_invoice_id=?",
  //         [
  //           stripe_invoice_status,
  //           stripe_subscription_status,
  //           stripe_latest_payment_status,
  //           stripe_latest_payment_method,
  //           stripe_latest_charge,
  //           stripe_latest_payment_message,
  //           JSON.stringify(updated_log),
  //           stripe_current_period_start,
  //           stripe_current_period_end,
  //           stripe_invoice_id,
  //         ],
  //         (err, data) => {
  //           if (err) {
  //             console.error(
  //               "DB Query Error: Could not update existing transaction",
  //               err
  //             );
  //             return reject(err);
  //           }
  //           resolve(true);
  //         }
  //       );
  //     });
  //   }
  //   getIO().emit("update-user");
  // } catch (err) {
  //   console.error("Database error:", err);
  //   return
  // }
};

export const updateUserCredits = async (credits: any, user_id: string) => {
  const connection = await db.promise().getConnection();
  const user = await getUserByIdFunction(connection, user_id)
  if (!user || !user.credits) return;

  const updatedCredits = parseInt(user.credits) + parseInt(credits);
  await new Promise((resolve, reject) => {
    db.query(
      "UPDATE users SET `credits`=? WHERE user_id=?",
      [updatedCredits, user_id],
      (err, data) => {
        if (err) {
          console.error("DB Query Error: Could not update user", err);
          return reject(err);
        }
        resolve(true);
      }
    );
  });
};
