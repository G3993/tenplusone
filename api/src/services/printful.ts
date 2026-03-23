const PRINTFUL_API = 'https://api.printful.com';

// Bella+Canvas 3001 Unisex Short Sleeve Jersey Tee - Black
// Sizes S through 2XL. These are Printful catalog variant IDs.
// Verify with GET /products/71 during setup -- if IDs differ, update here.
export const TSHIRT_VARIANT_IDS = [4012, 4013, 4014, 4015, 4017];
const RETAIL_PRICE = '34.99';

export async function createPrintfulProduct(
  apiToken: string,
  title: string,
  imageUrl: string
): Promise<{ id: number; externalId: string }> {
  const body = {
    sync_product: {
      name: title,
      thumbnail: imageUrl,
    },
    sync_variants: TSHIRT_VARIANT_IDS.map((variantId) => ({
      variant_id: variantId,
      retail_price: RETAIL_PRICE,
      files: [
        {
          type: 'front',
          url: imageUrl,
        },
      ],
    })),
  };

  const res = await fetch(`${PRINTFUL_API}/store/products`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Printful product creation failed: ${err}`);
  }

  const data: { result: { id: number; external_id: string } } = await res.json();
  return { id: data.result.id, externalId: data.result.external_id };
}
