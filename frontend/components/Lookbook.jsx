import { useEffect, useState } from 'react';
import { storefrontFetch } from '../lib/storefront.js';
import ProductCarousel from './ProductCarousel.jsx';

const LOOKBOOK_QUERY = `
  query GetLookbookMetaobject($handle: String!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    metaobject(handle: { type: "lookbook", handle: $handle }) {
      id
      handle
      type

      title: field(key: "title") {
        value
      }

      description: field(key: "description") {
        value
      }

      featuredImage: field(key: "featured_image") {
        reference {
          ... on MediaImage {
            image {
              url
              altText
              width
              height
            }
          }
        }
      }

      products: field(key: "products") {
        references(first: 20) {
          nodes {
            ... on Product {
              id
              handle
              title
              featuredImage {
                url
                altText
                width
                height
              }
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  }
`;

const PRODUCT_LOOKBOOKS_QUERY = `
  query GetProductLookbooks($after: String) {
    metaobjects(type: "lookbook", first: 250, after: $after) {
      nodes {
        handle
        products: field(key: "products") {
          value
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const MAX_PRODUCT_LOOKBOOKS = 2;

/**
 * @typedef {{ url: string, altText: string | null, width: number, height: number }} LookbookImage
 * @typedef {import('./ProductCarousel.jsx').CarouselProduct} LookbookProduct
 * @typedef {{
 *   title: string | null,
 *   description: string | null,
 *   image: LookbookImage | null,
 *   products: LookbookProduct[],
 * }} LookbookData
 */

/**
 * @param {any} metaobject
 * @returns {LookbookData}
 */
function normalizeLookbook(metaobject) {
  return {
    title: metaobject.title?.value ?? null,
    description: metaobject.description?.value ?? null,
    image: metaobject.featuredImage?.reference?.image ?? null,
    products: (metaobject.products?.references?.nodes ?? [])
      .filter((/** @type {any} */ node) => node?.handle)
      .map((/** @type {any} */ node) => ({
        id: node.id,
        handle: node.handle,
        title: node.title,
        featuredImage: node.featuredImage ?? null,
        price: node.priceRange?.minVariantPrice ?? null,
      })),
  };
}

/** @param {LookbookData} data */
function isEmptyLookbook(data) {
  return !data.title && !data.description && !data.image && data.products.length === 0;
}

/**
 * @param {string | null | undefined} value
 * @returns {string[]}
 */
function parseReferenceList(value) {
  try {
    const ids = JSON.parse(value ?? '[]');
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

/**
 * @param {string} productId
 * @param {AbortSignal} signal
 * @returns {Promise<string[]>}
 */
async function findLookbooksForProduct(productId, signal) {
  /** @type {string[]} */
  const handles = [];
  /** @type {string | null} */
  let after = null;

  do {
    /** @type {any} */
    const result = await storefrontFetch(PRODUCT_LOOKBOOKS_QUERY, { after }, { signal });
    for (const node of result?.metaobjects?.nodes ?? []) {
      if (parseReferenceList(node.products?.value).includes(productId)) {
        handles.push(node.handle);
        if (handles.length >= MAX_PRODUCT_LOOKBOOKS) return handles;
      }
    }
    const pageInfo = result?.metaobjects?.pageInfo;
    after = pageInfo?.hasNextPage ? pageInfo.endCursor : null;
  } while (after);
  return handles;
}

/**
 * @param {{ template?: string, lookbook?: { handle: string } | null, productId?: string | null }} options
 * @returns {string[] | null} 
 */
function useLookbookHandles({ template, lookbook, productId }) {
  const isProductPage = template === 'product';
  const settingHandle = lookbook?.handle ?? null;
  const [productHandles, setProductHandles] = useState(/** @type {string[] | null} */ (null));

  useEffect(() => {
    if (!isProductPage || !productId) return;

    const controller = new AbortController();
    setProductHandles(null);

    findLookbooksForProduct(productId, controller.signal)
      .then(setProductHandles)
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error(error);
        setProductHandles([]);
      });

    return () => controller.abort();
  }, [isProductPage, productId]);

  if (isProductPage) return productId ? productHandles : [];
  return settingHandle ? [settingHandle] : [];
}

/**
 * @param {{
 *   template?: string,
 *   heading?: string,
 *   lookbook?: { handle: string, id: string } | null,
 *   productId?: string | null,
 *   rootUrl?: string,
 *   loadingLabel?: string,
 *   productPlaceholder?: string,
 * }} props
 */
export default function Lookbook({
  template,
  heading,
  lookbook,
  productId,
  rootUrl = '/',
  loadingLabel,
  productPlaceholder,
}) {
  const handles = useLookbookHandles({ template, lookbook, productId });

  if (handles === null) return loadingLabel ? <p>{loadingLabel}</p> : null;
  if (!handles.length) return null;

  return (
    <div className="lookbook flex flex-col items-start gap-[var(--gap-md)]">
      {heading ? <h2 className="react-section__heading">{heading}</h2> : null}
      <div className="flex w-full flex-col gap-16">
        {handles.map((handle) => (
          <LookbookEntry
            key={handle}
            handle={handle}
            rootUrl={rootUrl}
            loadingLabel={loadingLabel}
            productPlaceholder={productPlaceholder}
            fallbackLabel={heading}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * @param {{
 *   handle: string,
 *   rootUrl: string,
 *   loadingLabel?: string,
 *   productPlaceholder?: string,
 *   fallbackLabel?: string,
 * }} props
 */
function LookbookEntry({ handle, rootUrl, loadingLabel, productPlaceholder, fallbackLabel }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState(handle ? 'loading' : 'idle');

  useEffect(() => {
    if (!handle) {
      setData(null);
      setStatus('idle');
      return;
    }

    const controller = new AbortController();
    setStatus('loading');

    storefrontFetch(LOOKBOOK_QUERY, { handle }, { signal: controller.signal })
      .then((/** @type {any} */ result) => {
        if (!result?.metaobject) throw new Error(`Lookbook metaobject "${handle}" not found`);
        setData(normalizeLookbook(result.metaobject));
        setStatus('ready');
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error(error);
        setStatus('error');
      });

    return () => controller.abort();
  }, [handle]);

  const productBase = `${rootUrl.replace(/\/$/, '')}/products/`;

  if (status === 'idle' || (status === 'ready' && data && isEmptyLookbook(data))) return null;

  return (
    <div className="w-full">
      {status === 'loading' && loadingLabel ? <p>{loadingLabel}</p> : null}

      {status === 'ready' && data ? (
        <div
          className={`grid w-full items-center gap-12 sm:grid-cols-1 sm:gap-8 ${
            data.image ? 'grid-cols-[5fr_7fr]' : 'grid-cols-1'
          }`}
        >
          {data.image ? (
            <div className="flex aspect-[4/5] max-h-[80vh] w-full items-center justify-center bg-current/5 p-8 sm:aspect-square sm:max-h-[60vh]">
              <img
                className="h-full! w-full object-contain [image-rendering:pixelated]"
                src={data.image.url}
                alt={data.image.altText ?? data.title ?? ''}
                width={data.image.width}
                height={data.image.height}
                loading="lazy"
              />
            </div>
          ) : null}
          <div className="flex min-w-0 flex-col gap-8">
            {data.title || data.description ? (
              <div className="flex max-w-[60ch] flex-col gap-3">
                {data.title ? (
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.14em]">
                    {data.title}
                  </p>
                ) : null}
                {data.description ? (
                  <p className="m-0 text-lg leading-[1.6]!">{data.description}</p>
                ) : null}
              </div>
            ) : null}
            {data.products.length ? (
              <ProductCarousel
                products={data.products}
                productBase={productBase}
                placeholder={productPlaceholder}
                label={data.title ?? fallbackLabel}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
