import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

const components = import.meta.glob('../components/*.jsx');

/** @param {string} name */
function loadComponent(name) {
  const loader = components[`../components/${name}.jsx`];
  if (!loader) return Promise.reject(new Error(`Unknown React section component "${name}"`));
  return loader().then((module) => module.default);
}

class ReactSection extends HTMLElement {
  /** @type {import('react-dom/client').Root | null} */
  #root = null;
  #connected = false;

  async connectedCallback() {
    this.#connected = true;
    const name = this.getAttribute('component');
    const container = this.querySelector('[data-react-root]');
    if (!name || !(container instanceof HTMLElement)) return;

    let props = {};
    const propsScript = this.querySelector('script[data-react-props]');
    if (propsScript?.textContent) {
      try {
        props = JSON.parse(propsScript.textContent);
      } catch (error) {
        console.error(`Invalid props JSON for React section "${name}"`, error);
      }
    }

    try {
      const Component = await loadComponent(name);
      if (!this.#connected || this.#root) return;
      this.#root = createRoot(container);
      this.#root.render(createElement(Component, props));
    } catch (error) {
      console.error(error);
    }
  }

  disconnectedCallback() {
    this.#connected = false;
    this.#root?.unmount();
    this.#root = null;
  }
}

if (!customElements.get('react-section')) {
  customElements.define('react-section', ReactSection);
}
