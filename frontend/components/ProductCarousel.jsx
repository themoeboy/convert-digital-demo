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

/** @param {{ direction: 'left' | 'right' }} props */
function Chevron({ direction }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d={direction === 'left' ? 'M10 3 5 8l5 5' : 'm6 3 5 5-5 5'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
      />
    </svg>
  );
}

/**
 * @param {{
 *   products: CarouselProduct[],
 *   productBase: string,
 *   label?: string,
 *   heading?: string,
 *   placeholder?: string,
 * }} props
 */
export default function ProductCarousel({
  products,
  productBase,
  label = 'Products',
  heading = 'Shop the look',
  placeholder,
}) {
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
    <div className="product-carousel" role="region" aria-label={label}>
      <div className="product-carousel__header">
        <p className="product-carousel__heading">
          {heading} <span className="product-carousel__count">({products.length})</span>
        </p>
        {showControls ? (
          <div className="product-carousel__controls">
            <button
              type="button"
              className="product-carousel__button"
              onClick={() => scrollByPage(-1)}
              disabled={!canPrev}
              aria-label="Previous products"
            >
              <Chevron direction="left" />
            </button>
            <button
              type="button"
              className="product-carousel__button"
              onClick={() => scrollByPage(1)}
              disabled={!canNext}
              aria-label="Next products"
            >
              <Chevron direction="right" />
            </button>
          </div>
        ) : null}
      </div>

      <ul ref={trackRef} className="product-carousel__track">
        {products.map((product) => (
          <li key={product.id} className="product-carousel__slide">
            <a href={`${productBase}${product.handle}`} className="product-carousel__tile">
              <div className="product-carousel__media">
                {product.featuredImage ? (
                  <img
                    className="product-carousel__image"
                    src={product.featuredImage.url}
                    alt={product.featuredImage.altText ?? product.title}
                    width={product.featuredImage.width}
                    height={product.featuredImage.height}
                    loading="lazy"
                  />
                ) : placeholder ? (
                  <div
                    className="product-carousel__placeholder"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: placeholder }}
                  />
                ) : null}
              </div>
              <div className="product-carousel__info">
                <span className="product-carousel__title">{product.title}</span>
                {product.price ? (
                  <span className="product-carousel__price">
                    {formatMoney(product.price)}
                  </span>
                ) : null}
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
