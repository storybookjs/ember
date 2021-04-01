import { LitElement, html, css, customElement, property } from 'lit-element';
import { classMap } from 'lit-html/directives/class-map';

@customElement('demo-button')
export class DemoButton extends LitElement {
  static get styles() {
    return css``;
  }

  @property({ type: String, reflect: true })
  label = 'Click Me';

  @property({ type: Boolean, reflect: true })
  primary = false;

  @property({ type: String })
  value = '';

  render() {
    return html`
      ${this.label && html`<label for="button">${this.label}</label>`}
      <button id="button" class=${classMap({ primary: this.primary })} value="${this.value}">
        <slot></slot>
      </button>
    `;
  }
}
