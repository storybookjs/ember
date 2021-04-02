import { LitElement, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import DogeCoinImg from './dogecoin.svg';
import DogeCoinAlt from './dogecoin-alt.svg';

@customElement('doge-coin')
export class DogeCoin extends LitElement {
  static get styles() {
    return css`
      :host {
        height: 10rem;
        width: 10rem;
        display: flex;
      }
      svg {
        height: 100%;
        width: 100%;
      }
    `;
  }

  // TODO: currently decorators are not reflected https://github.com/Polymer/lit-html/issues/1476
  static get properties() {
    return {
      flip: { type: Boolean },
    };
  }

  flip = false;

  constructor() {
    super();
    // TODO: setup public directory to pull svgs from
    console.log('import.meta', import.meta.url);
  }

  render() {
    return this.flip ? DogeCoinImg : DogeCoinAlt;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'doge-coin': DogeCoin;
  }
}
