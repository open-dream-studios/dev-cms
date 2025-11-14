// server/services/wave/wave.ts
import fetch from "node-fetch";
import { writeFileSync } from "fs";
import { parse as json2csv } from "json2csv";
import dotenv from "dotenv";
dotenv.config();

const API_URL = "https://gql.waveapps.com/graphql/public";
const ACCESS_TOKEN = process.env.WAVE_ACCESS_TOKEN;
const WAVE_BUSINESS_ID = process.env.WAVE_BUSINESS_ID;
const PAGE_SIZE = 100;

if (!ACCESS_TOKEN) {
  console.error("Missing WAVE_ACCESS_TOKEN in .env");
  process.exit(1);
}

async function graphql(query: any, variables = {}) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
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

async function listBusinesses() {
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
  const data = await graphql(query, variables);
  const b = data.businesses.edges.map((e: any) => e.node);
  return { businesses: b, pageInfo: data.businesses.pageInfo };
}

async function fetchAllCustomersForBusiness(businessId: string) {
  // We'll page until we've collected all pages.
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
    const data = await graphql(query, variables);
    const block = data.business.customers;
    if (!block) break; // no customers or no access

    totalPages = block.pageInfo.totalPages || 1;
    for (const edge of block.edges) {
      const c = edge.node;

      // --- normalize address ---
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

      // --- clean functions ---
      const lower = (val: string) => (val ? val.toLowerCase().trim() : "");
      const cleanPhone = (val: string) => {
        if (!val) return "";
        // remove everything that's not a number
        const digits = val.replace(/\D/g, "");
        // get the last 10 digits (useful for US numbers)
        return digits.slice(-10);
      };

      // --- push cleaned data ---
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

export async function importWaveCustomers() {
  try {
    const { businesses } = await listBusinesses();
    if (!businesses || businesses.length === 0) {
      console.log("No businesses found for this token.");
      return;
    }

    const chosenBusiness = businesses.find((b: any) =>
      b.id === WAVE_BUSINESS_ID
    );
    if (!chosenBusiness) return

    console.log(
      `\Fetching Wave Customers: ${chosenBusiness.name} (id: ${chosenBusiness.id})\n`
    );

    const customers = await fetchAllCustomersForBusiness(chosenBusiness.id);

    if (!customers.length) {
      console.log("No customers found.");
      return;
    }

    // CSV fields: custom order
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
  } catch (err) {
    console.error("Error:", err);
  }
}

importWaveCustomers();
