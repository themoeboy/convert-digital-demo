import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * @typedef {{ amount: string, currencyCode: string }} Money
 * @typedef {{
 *   id: string,
 *   handle: string,
 *   title: string,
 *   featuredImage: { url: string, altText: string | null, width: number, height: number } | null,
 *   price: Money | null,
 * }} CarouselProduct
 */

/** @param {Money} money */
function formatMoney({ amount, currencyCode }) {
  const locale = document.documentElement.lang || undefined;
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode }).format(
      Number(amount),
    );
  } catch {
    return `${amount} ${currencyCode}`;
  }
}

/**
 * @param {{ products: CarouselProduct[], productBase: string, label?: string, placeholder?: string }} props
 */
export default function ProductCarousel({ products, productBase, label = 'Products', placeholder }) {
  const trackRef = useRef(/** @type {HTMLUListElement | null} */ (null));
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateButtons = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanPrev(track.scrollLeft > 1);
    setCanNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updateButtons();
    track.addEventListener('scroll', updateButtons, { passive: true });
    const observer = new ResizeObserver(updateButtons);
    observer.observe(track);
    return () => {
      track.removeEventListener('scroll', updateButtons);
      observer.disconnect();
    };
  }, [updateButtons, products]);

  /** @param {1 | -1} direction */
  const scrollByPage = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth, behavior: 'smooth' });
  };

  const showControls = canPrev || canNext;

  return (
    <div className="lookbook__carousel relative w-full min-w-0" role="region" aria-label={label}>
      <ul
        ref={trackRef}
        className="m-0 flex list-none snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <li
            key={product.id}
            className="w-[calc((100%-1rem)/2)] shrink-0 snap-start sm:w-[calc((100%-1rem)/2.25)]"
          >
            <a
              href={`${productBase}${product.handle}`}
              className="flex flex-col gap-2 text-inherit no-underline"
            >
              <div className="aspect-square w-full overflow-hidden bg-black/5">
                {product.featuredImage ? (
                  <img
                    className="h-full w-full object-cover"
                    src={product.featuredImage.url}
                    alt={product.featuredImage.altText ?? product.title}
                    width={product.featuredImage.width}
                    height={product.featuredImage.height}
                    loading="lazy"
                  />
                ) : placeholder ? (
                  <div
                    className="h-full w-full"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: placeholder }}
                  />
                ) : null}
              </div>
              <span className="lookbook__product-title">{product.title}</span>
              {product.price ? (
                <span className="lookbook__product-price">{formatMoney(product.price)}</span>
              ) : null}
            </a>
          </li>
        ))}
      </ul>

      {showControls ? (
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="lookbook__carousel-button"
            onClick={() => scrollByPage(-1)}
            disabled={!canPrev}
            aria-label="Previous products"
          >
            ‹
          </button>
          <button
            type="button"
            className="lookbook__carousel-button"
            onClick={() => scrollByPage(1)}
            disabled={!canNext}
            aria-label="Next products"
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  );
}
