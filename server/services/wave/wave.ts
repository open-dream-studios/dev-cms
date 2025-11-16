// server/services/wave/wave.ts
import fetch from "node-fetch";
import { writeFileSync } from "fs";
import { parse as json2csv } from "json2csv";
import dotenv from "dotenv";
import { cleanPhone } from "../../functions/data.js";
dotenv.config();

const API_URL = "https://gql.waveapps.com/graphql/public";
const PAGE_SIZE = 100;

async function graphql(WAVE_ACCESS_TOKEN: string, query: any, variables = {}) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WAVE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Network error: ${res.status} ${res.statusText} - ${txt}`);
  }

  const j: any = await res.json();
  if (j.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(j.errors)}`);
  }
  return j.data;
}

async function listBusinesses(WAVE_ACCESS_TOKEN: string) {
  const query = `
    query ($page: Int!, $pageSize: Int!) {
      businesses(page: $page, pageSize: $pageSize) {
        pageInfo {
          currentPage
          totalPages
          totalCount
        }
        edges {
          node {
            id
            name
          }
        }
      }
    }
  `;
  // fetch first page (small)
  const variables = { page: 1, pageSize: 50 };
  const data = await graphql(WAVE_ACCESS_TOKEN, query, variables);
  const b = data.businesses.edges.map((e: any) => e.node);
  return { businesses: b, pageInfo: data.businesses.pageInfo };
}

async function fetchAllCustomersForBusiness(
  WAVE_ACCESS_TOKEN: string,
  businessId: string
) {
  const query = `
    query ($businessId: ID!, $page: Int!, $pageSize: Int!) {
      business(id: $businessId) {
        customers(page: $page, pageSize: $pageSize) {
          pageInfo {
            currentPage
            totalPages
            totalCount
          }
          edges {
            node {
              id
              name
              firstName
              lastName
              email
              phone
              mobile
              address {
                addressLine1
                addressLine2
                city
                province {
                  code
                  name
                }
                postalCode
                country {
                  code
                  name
                }
              }
              currency {
                code
              }
            }
          }
        }
      }
    }
  `;

  const customers = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const variables = { businessId, page, pageSize: PAGE_SIZE };
    const data = await graphql(WAVE_ACCESS_TOKEN, query, variables);
    const block = data.business.customers;
    if (!block) break;

    totalPages = block.pageInfo.totalPages || 1;
    for (const edge of block.edges) {
      const c = edge.node;

      // --- NORMALIZE ---
      const addr = c.address
        ? [
            c.address.addressLine1 || "",
            c.address.addressLine2 || "",
            c.address.city || "",
            c.address.province?.name || "",
            c.address.postalCode || "",
            c.address.country?.name || "",
          ]
            .filter(Boolean)
            .join(", ")
        : "";

      // --- CLEAN ---
      const lower = (val: string) => (val ? val.toLowerCase().trim() : "");

      customers.push({
        id: c.id,
        name: lower(
          c.name || `${c.firstName || ""} ${c.lastName || ""}`.trim()
        ),
        firstName: lower(c.firstName || ""),
        lastName: lower(c.lastName || ""),
        email: lower(c.email || ""),
        phone: cleanPhone(c.phone || ""),
        mobile: cleanPhone(c.mobile || ""),
        address: addr,
        currency: c.currency?.code || "",
      });
    }

    console.log(
      `Fetched page ${page}/${totalPages} (${customers.length} customers so far)`
    );
    page++;
  }

  return customers;
}

export async function importWaveCustomers(
  WAVE_ACCESS_TOKEN: string,
  WAVE_BUSINESS_ID: string
) {
  if (!WAVE_ACCESS_TOKEN.length || !WAVE_BUSINESS_ID.length) {
    console.error("Missing required credentials");
    return false;
  }

  try {
    const { businesses } = await listBusinesses(WAVE_ACCESS_TOKEN);
    if (!businesses || businesses.length === 0) {
      console.log("No businesses found for this token.");
      return false;
    }

    const chosenBusiness = businesses.find(
      (b: any) => b.id === WAVE_BUSINESS_ID
    );
    if (!chosenBusiness) return false;

    console.log(
      `\Fetching Wave Customers: ${chosenBusiness.name} (id: ${chosenBusiness.id})\n`
    );

    const customers = await fetchAllCustomersForBusiness(
      WAVE_ACCESS_TOKEN,
      chosenBusiness.id
    );

    if (!customers.length) {
      console.log("No customers found.");
      return false;
    }

    const fields = [
      "id",
      "name",
      "firstName",
      "lastName",
      "email",
      "phone",
      "mobile",
      "address",
      "currency",
    ];
    const csv = json2csv(customers, { fields });
    const outName = `./tmp/wave_customers.csv`;
    writeFileSync(outName, csv, "utf8");
    console.log(`\n✅ Wrote ${customers.length} customers to ${outName}`);
    return true;
  } catch (err) {
    console.error("Error:", err);
    return false;
  }
}
