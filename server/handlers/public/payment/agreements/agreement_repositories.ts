// server/handlers/public/payment/agreements/agreement_repositories.ts
import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { ulid } from "ulid";

export const insertSubscriptionAgreementFunction = async (
  connection: PoolConnection,
  project_idx: number,
  reqBody: any
) => {
  const {
    agreement_version,
    plan_type,
    full_name_entered,
    email_entered,
    stripe_checkout_session_id,
    test,
  } = reqBody;

  if (
    !agreement_version ||
    !plan_type ||
    !full_name_entered ||
    !email_entered ||
    !stripe_checkout_session_id
  ) {
    throw new Error("Missing required agreement fields");
  }

  const agreement_id = `AGR-${ulid()}`;

  const query = `
    INSERT INTO subscription_agreements (
      agreement_id,
      project_idx,
      agreement_version,
      plan_type,
      full_name_entered,
      email_entered,
      accepted_at,
      stripe_checkout_session_id,
      stripe_subscription_id,
      test
    )
    VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, NULL, ?)
  `;

  const values = [
    agreement_id,
    project_idx,
    agreement_version,
    plan_type,
    full_name_entered,
    email_entered,
    stripe_checkout_session_id,
    test
  ];

  const [result] = await connection.query<ResultSetHeader>(
    query,
    values
  );

  if (!result.insertId) {
    throw new Error("Failed to insert subscription agreement");
  }

  return {
    success: true,
    id: result.insertId,
    agreement_id,
  };
};


export const attachSubscriptionIdToAgreementFunction = async (
  connection: PoolConnection,
  stripe_checkout_session_id: string,
  stripe_subscription_id: string
) => {
  if (!stripe_checkout_session_id || !stripe_subscription_id) {
    throw new Error("Missing required subscription linkage fields");
  }

  const query = `
    UPDATE subscription_agreements
    SET stripe_subscription_id = ?,
        updated_at = NOW()
    WHERE stripe_checkout_session_id = ?
      AND stripe_subscription_id IS NULL
    LIMIT 1
  `;

  const [result] = await connection.query<ResultSetHeader>(query, [
    stripe_subscription_id,
    stripe_checkout_session_id,
  ]);

  if (result.affectedRows === 0) {
    throw new Error(
      "No matching agreement found or subscription already attached"
    );
  }

  return { success: true };
};