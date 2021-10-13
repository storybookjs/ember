import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('sb-counter')
export class SbCounter extends LitElement {
  count: number;

  static get properties() {
    return {
      count: { type: Number },
    };
  }

  constructor() {
    super();
    this.count = 0;
  }

  setCount = (count: number) => {
    this.count = count;
  };

  render() {
    const { count } = this;
    return html`
      <h1>Lit Element - Counter</h1>
      <h2>You clicked ${count} times</h2>
      <button type="button" @click=${() => this.setCount(count - 1)}>Decrement</button>
      <button type="button" @click=${() => this.setCount(count + 1)}>Increment</button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sb-counter': SbCounter;
  }
}
