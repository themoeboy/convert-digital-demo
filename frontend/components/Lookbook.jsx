import { useEffect, useState } from 'react';
import { storefrontFetch } from '../lib/storefront.js';

const LOOKBOOK_QUERY = `
  query GetLookbookMetaobject($handle: String!) {
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
            }
          }
        }
      }
    }
  }
`;

/**
 * @typedef {{ url: string, altText: string | null, width: number, height: number }} LookbookImage
 * @typedef {{ id: string, handle: string, title: string }} LookbookProduct
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
    products: (metaobject.products?.references?.nodes ?? []).filter(
      (/** @type {any} */ node) => node?.handle,
    ),
  };
}

/**
 * @param {{
 *   heading?: string,
 *   lookbook?: { handle: string, id: string } | null,
 *   rootUrl?: string,
 *   loadingLabel?: string,
 * }} props
 */

export default function Lookbook({ heading, lookbook, rootUrl = '/', loadingLabel }) {
  const handle = lookbook?.handle;
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

  return (
    <div className="react-section lookbook">
      {heading ? <h2 className="react-section__heading">{heading}</h2> : null}

      {status === 'loading' && loadingLabel ? <p>{loadingLabel}</p> : null}

      {status === 'ready' && data ? (
        <div className="w-full flex flex-row sm:flex-col gap-4">
          {data.image ? (
            <div className="w-1/2 sm:w-full">
              <img
                className="lookbook__image object-cover"
                src={data.image.url}
                alt={data.image.altText ?? data.title ?? ''}
                width={data.image.width}
                height={data.image.height}
                loading="lazy"
              />
            </div>
          ) : null}
          <div className="w-1/2 sm:w-full flex flex-col gap-4"> 
          {data.description ? <p className="lookbook__description">{data.description}</p> : null}
          {data.products.length ? (
            <ul className="lookbook__products">
              {data.products.map((product) => (
                <li key={product.id}>
                  <a href={`${productBase}${product.handle}`}>{product.title}</a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        </div>
      ) : null}
    </div>
  );
}
