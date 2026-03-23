import { createAdminApiClient } from '@shopify/admin-api-client';

const CREATE_DISCOUNT = `#graphql
  mutation CreateDiscount($basicCodeDiscount: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode { id codeDiscount { ... on DiscountCodeBasic { codes(first:1) { nodes { code } } } } }
      userErrors { field message }
    }
  }
`;

export async function createWinnerDiscount(
  storeDomain: string,
  adminToken: string,
  matchId: string,
  userEmail: string
): Promise<{ code: string; percentage: number }> {
  const admin = createAdminApiClient({
    storeDomain,
    apiVersion: '2025-10',
    accessToken: adminToken,
  });

  const code = `WIN-${matchId}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  await admin.request(CREATE_DISCOUNT, {
    variables: {
      basicCodeDiscount: {
        title: `Winner: ${userEmail} - Match ${matchId}`,
        code,
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        customerSelection: { all: true },
        customerGets: {
          value: { percentage: 0.5 },
          items: { all: true },
        },
        usageLimit: 1,
        appliesOncePerCustomer: true,
      },
    },
  });

  return { code, percentage: 0.50 };
}

export async function createConsolationDiscount(
  storeDomain: string,
  adminToken: string,
  matchId: string,
  userEmail: string
): Promise<{ code: string; percentage: number }> {
  const admin = createAdminApiClient({
    storeDomain,
    apiVersion: '2025-10',
    accessToken: adminToken,
  });

  const code = `TY-${matchId}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  await admin.request(CREATE_DISCOUNT, {
    variables: {
      basicCodeDiscount: {
        title: `Consolation: ${userEmail} - Match ${matchId}`,
        code,
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 168 * 60 * 60 * 1000).toISOString(),
        customerSelection: { all: true },
        customerGets: {
          value: { percentage: 0.15 },
          items: { all: true },
        },
        usageLimit: 1,
        appliesOncePerCustomer: true,
      },
    },
  });

  return { code, percentage: 0.15 };
}
