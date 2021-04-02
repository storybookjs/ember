import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

/**
 * An example element.
 *
 * @slot - The content inside the button
 * @csspart button - The button
 */
@customElement('demo-button')
export class DemoButton extends LitElement {
  static get styles() {
    return css``;
  }

  label = 'Click Me';

  primary = false;

  value = '';

  // TODO: currently decorators are not reflected https://github.com/Polymer/lit-html/issues/1476
  static get properties() {
    return {
      label: { type: String, reflect: true },
      primary: { type: Boolean },
      value: { type: String },
    };
  }

  render() {
    return html`
      ${this.label && html`<label for="button">${this.label}</label>`}
      <button
        id="button"
        part="button"
        class=${classMap({ primary: this.primary })}
        value="${this.value}"
      >
        <slot></slot>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'demo-button': DemoButton;
  }
}
