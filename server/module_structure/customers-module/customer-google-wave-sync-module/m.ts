// server/module_structure/customers-module/customer-products-module/customer-google-wave-sync-module/m.ts
import {
  Customer,
  CustomerInput,
  ModuleFunctionInputs,
} from "@open-dream/shared";
import { importWaveCustomers } from "../../../services/wave/wave.js";
import { importGoogleContacts } from "../../../services/google/googleCustomers.js";
import {
  cleanNameForMatch,
  isValidEmail,
  isValidPhone10,
} from "../../../functions/data.js";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import {
  getCustomersFunction,
  upsertCustomerFunction,
} from "../../../handlers/modules/customers/customers_repositories.js";
import { internalTransaction } from "../../../util/handlerWrappers.js";
import { PoolConnection } from "mysql2/promise";

export const keys = {
  WAVE_ACCESS_TOKEN: true,
  WAVE_BUSINESS_ID: true,
  GOOGLE_CLIENT_SECRET_OBJECT: true,
  GOOGLE_REFRESH_TOKEN_OBJECT: true,
};

export const run = async ({
  connection,
  project_idx,
  identifier,
  module,
  body,
  decryptedKeys,
}: ModuleFunctionInputs) => {
  try {
    const {
      WAVE_ACCESS_TOKEN,
      WAVE_BUSINESS_ID,
      GOOGLE_CLIENT_SECRET_OBJECT,
      GOOGLE_REFRESH_TOKEN_OBJECT,
    } = decryptedKeys;

    if (
      !WAVE_ACCESS_TOKEN ||
      !WAVE_BUSINESS_ID ||
      !GOOGLE_CLIENT_SECRET_OBJECT ||
      !GOOGLE_REFRESH_TOKEN_OBJECT
    ) {
      return { success: false };
    }

    // const wave_success = await importWaveCustomers(
    //   WAVE_ACCESS_TOKEN,
    //   WAVE_BUSINESS_ID
    // );

    // const google_success = await importGoogleContacts(
    //   GOOGLE_CLIENT_SECRET_OBJECT,
    //   GOOGLE_REFRESH_TOKEN_OBJECT
    // );

    // if (wave_success && google_success) {
    const collectedCustomers: CollectedCustomer[] | false =
      await collectCustomersFromCSVs();
    if (collectedCustomers) {
      const success = await internalTransaction(
        async (connection: PoolConnection) => {
          return await integrateCollectedCustomers(
            project_idx,
            collectedCustomers,
            connection
          );
        }
      );
    }
    // }
    // return { success: false };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
};

function parseWaveRow(row: any) {
  function pickValidPhone(phone?: string, mobile?: string): string | null {
    const clean = (p: string | undefined) =>
      typeof p === "string" ? p.replace(/\D/g, "") : "";

    const p1 = clean(phone);
    if (p1.length === 10) return p1;

    const p2 = clean(mobile);
    if (p2.length === 10) return p2;

    return null;
  }

  const name = (row.name || "").trim();
  const firstName = (row.firstName || "").trim();
  const lastName = (row.lastName || "").trim();
  const email = (row.email || "").trim();
  const phone = row.phone || "";
  const mobile = row.mobile || "";
  const address = row.address?.trim() || null;

  // ---------- RULE 1: must have a valid email ----------
  if (!isValidEmail(email)) return null;

  // ---------- RULE 2: must have name FIRST ----------
  const hasFirstLast = firstName.length >= 1 && lastName.length >= 1;

  let finalFirst = "";
  let finalLast = "";

  // ---------- CASE A: try using `name` if it can be split ----------
  if (name) {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      // first word = first name, rest = last name
      finalFirst = parts[0];
      finalLast = parts.slice(1).join(" ");
    }
  }

  // ---------- CASE B: fallback to firstName + lastName ----------
  if (!finalFirst || !finalLast) {
    if (!hasFirstLast) return null; // rule says skip if we can't guarantee
    finalFirst = firstName;
    finalLast = lastName;
  }

  // ---------- RULE: name MUST exist now ----------
  if (!finalFirst || !finalLast) return null;

  // ---------- PHONE ----------
  const finalPhone = pickValidPhone(phone, mobile);

  // ---------- ADDRESS ----------
  const finalAddress = address && address.length > 0 ? address : null;

  return {
    wave_customer_id: row.id,
    firstName: finalFirst,
    lastName: finalLast,
    email,
    phone: finalPhone,
    address: finalAddress,
  };
}

type CollectedCustomer = {
  wave_customer_id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
};

const collectCustomersFromCSVs = async () => {
  try {
    const wavePath = path.resolve("./tmp/wave_customers.csv");
    const googlePath = path.resolve("./tmp/google_contacts.csv");

    if (!fs.existsSync(wavePath)) {
      console.error("wave_customers.csv does not exist.");
      return false;
    }
    if (!fs.existsSync(googlePath)) {
      console.error("google_contacts.csv does not exist.");
      return false;
    }

    // -------------------------------
    // READ WAVE CSV
    // -------------------------------
    const waveRaw = fs.readFileSync(wavePath, "utf8");
    const waveRecords = parse(waveRaw, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const finalCustomers: any[] = [];
    for (const row of waveRecords as any[]) {
      const parsed = parseWaveRow(row);
      if (parsed) finalCustomers.push(parsed);
    }

    // -------------------------------
    // READ GOOGLE CONTACTS CSV
    // -------------------------------
    const googleRaw = fs.readFileSync(googlePath, "utf8");
    const googleRecords = parse(googleRaw, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // clean a name per your rules
    const cleanName = (s: string | undefined) => {
      if (!s || typeof s !== "string") return "";
      return s
        .toLowerCase()
        .replace(/[^a-z\s]/g, "") // letters + spaces ONLY
        .replace(/\s+/g, " ") // collapse extra spaces
        .trim();
    };

    // clean a phone number
    const cleanPhone10 = (p: string | undefined) => {
      if (!p || typeof p !== "string") return null;
      const digits = p.replace(/\D/g, "");
      return digits.length === 10 ? digits : null;
    };

    // preprocess google contacts → { cleanedName, phone }
    const googleCleaned = googleRecords.map((r: any) => {
      return {
        rawName: r.name || "",
        cleanedName: cleanName(r.name || ""),
        phone: cleanPhone10(r.phone || null),
      };
    });

    let matchedCount = 0;

    for (const cust of finalCustomers) {
      // Only match if phone is missing
      if (cust.phone && cust.phone.length === 10) continue;

      const waveClean = cleanName(`${cust.firstName} ${cust.lastName}`);

      if (!waveClean) continue;

      // Try exact match
      const found = googleCleaned.find(
        (g) => g.cleanedName && g.cleanedName === waveClean
      );

      if (!found) continue;

      if (found.phone) {
        cust.phone = found.phone;
        matchedCount++;
      }
    }

    return finalCustomers as CollectedCustomer[];
  } catch (err) {
    console.error("Error integrating CSVs:", err);
    return false;
  }
};

function convertCollectedToCustomerInput(
  c: CollectedCustomer,
  project_idx: number
) {
  return {
    customer_id: null,
    project_idx,
    first_name: c.firstName.toLowerCase(),
    last_name: c.lastName.toLowerCase(),
    email: c.email || null,
    phone: c.phone || null,
    address_line1: null,
    address_line2: null,
    city: null,
    state: null,
    zip: null,
    notes: null,
  };
}

function findExistingCustomerMatch(
  collected: CustomerInput,
  currentCustomers: Customer[]
): Customer | null {
  const collectedClean = cleanNameForMatch(
    collected.first_name,
    collected.last_name
  );
  for (const cur of currentCustomers) {
    const curClean = cleanNameForMatch(cur.first_name, cur.last_name);
    if (curClean === collectedClean) {
      return cur;
    }
  }
  return null;
}

function mergeCustomerData(
  project_idx: number,
  existing: Customer,
  incoming: CustomerInput
): CustomerInput {
  const existingEmailValid = isValidEmail(existing.email || "");
  const incomingEmailValid = isValidEmail(incoming.email || "");
  const existingPhoneValid = isValidPhone10(existing.phone || null);
  const incomingPhoneValid = isValidPhone10(incoming.phone || null);
  return {
    customer_id: existing.customer_id,
    project_idx,
    first_name: existing.first_name,
    last_name: existing.last_name,
    email: existingEmailValid
      ? existing.email
      : incomingEmailValid
      ? incoming.email
      : null,
    phone: existingPhoneValid
      ? existing.phone
      : incomingPhoneValid
      ? incoming.phone
      : null,
    address_line1: existing.address_line1,
    address_line2: existing.address_line2,
    city: existing.city,
    state: existing.state,
    zip: existing.zip,
    notes: existing.notes,
  };
}

const integrateCollectedCustomers = async (
  project_idx: number,
  collectedCustomers: CollectedCustomer[],
  connection: PoolConnection
) => {
  const currentCustomers = await getCustomersFunction(project_idx);
  for (const c of collectedCustomers) {
    const incoming = convertCollectedToCustomerInput(c, project_idx);
    const existing = findExistingCustomerMatch(incoming, currentCustomers);
    let finalData: CustomerInput;
    if (existing) {
      finalData = mergeCustomerData(project_idx, existing, incoming);
    } else {
      finalData = incoming;
    }
    await upsertCustomerFunction(connection, project_idx, finalData);
  }
  return true;
};
