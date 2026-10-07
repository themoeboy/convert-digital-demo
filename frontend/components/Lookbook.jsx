import { useState } from 'react';

/**
 * @param {{ heading?: string, incrementLabel: string, countLabel: string }} props
 */

export default function Lookbook({ heading, incrementLabel, countLabel }) {
  const [count, setCount] = useState(0);

  return (
    <div className="react-section">
      {heading ? <h2 className="react-section__heading">{heading}</h2> : null}
      <p aria-live="polite">
        {countLabel}: {count}
      </p>
      <button type="button" className="button" onClick={() => setCount((value) => value + 1)}>
        {incrementLabel}
      </button>
    </div>
  );
}
