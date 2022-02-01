import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('sb-counter')
export class Counter extends LitElement {
  static get properties() {
    return {
      count: { type: Number },
    };
  }

  count = 0;

  decrement = () => {
    this.count -= 1;
  };

  increment = () => {
    this.count += 1;
  };

  render() {
    const { count } = this;
    return html`
      <h1>Lit Element - Counter</h1>
      <h2 data-testid="count">You clicked ${count} times</h2>
      <button type="button" data-testid="decrement" @click=${() => this.decrement()}>
        Decrement
      </button>
      <button type="button" data-testid="increment" @click=${() => this.increment()}>
        Increment
      </button>
    `;
  }
}
