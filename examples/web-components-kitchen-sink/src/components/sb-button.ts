import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

/**
 * @attr {string} label - Label of the button
 * @attr {string} size - Size of the button, can be "small", "medium" or "large"; default is "medium".
 * @attr {string} backgroundColor - Color of the button's background
 *
 * @cssprop [--sb-primary-color=#1ea7fd] - Controls the color of bar
 *
 * @prop {boolean} primary - Set button in primary mode
 *
 * @event {CustomEvent} sb-button:click - Custom event send when the button is clicked
 *
 * @summary This is a simple Storybook Button
 *
 * @tag sb-button
 */
@customElement('sb-button')
export class SbButton extends LitElement {
  static get styles() {
    return css`
      .storybook-button {
        font-family: 'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-weight: 700;
        border: 0;
        border-radius: 3em;
        cursor: pointer;
        display: inline-block;
        line-height: 1;
      }
      .storybook-button--primary {
        color: white;
        background-color: var(--sb-primary-color, #1ea7fd);
      }
      .storybook-button--secondary {
        color: #333;
        background-color: transparent;
        box-shadow: rgba(0, 0, 0, 0.15) 0 0 0 1px inset;
      }
      .storybook-button--small {
        font-size: 12px;
        padding: 10px 16px;
      }
      .storybook-button--medium {
        font-size: 14px;
        padding: 11px 20px;
      }
      .storybook-button--large {
        font-size: 16px;
        padding: 12px 24px;
      }
    `;
  }

  // Currently TS decorators are not reflected so we have to use static `properties` function
  // https://github.com/Polymer/lit-html/issues/1476
  static get properties() {
    return {
      label: { type: String, reflect: true },
      primary: { type: Boolean },
      size: { type: String },
      backgroundColor: { type: String, attribute: 'background-color' },
    };
  }

  primary?: boolean;

  backgroundColor?: string;

  // FIXME: default value is overridden by `undefined` when the attribute isn't
  // defined in Story's args
  size: 'small' | 'medium' | 'large' = 'medium';

  label = '';

  private onClick() {
    const options = {
      bubbles: true,
      composed: true,
    };
    this.dispatchEvent(new CustomEvent('sb-button:click', options));
  }

  render() {
    const mode = this.primary ? 'storybook-button--primary' : 'storybook-button--secondary';
    const style = styleMap({ backgroundColor: this.backgroundColor ?? null });

    return html`
      <button
        type="button"
        class=${['storybook-button', `storybook-button--${this.size ?? 'medium'}`, mode].join(' ')}
        style=${style}
        @click="${this.onClick}"
      >
        ${this.label}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sb-button': SbButton;
  }
}
