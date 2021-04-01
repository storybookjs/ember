import { LitElement, css, customElement, property } from 'lit-element';
import DogeCoinImg from './dogecoin.svg';
import DogeCoinAlt from './dogecoin-alt.svg';

@customElement('doge-coin')
export class DogeCoin extends LitElement {
  static get styles() {
    return css``;
  }

  @property({ type: Boolean, reflect: true })
  flip = false;

  render() {
    return this.flip ? DogeCoinImg : DogeCoinAlt;
  }
}
