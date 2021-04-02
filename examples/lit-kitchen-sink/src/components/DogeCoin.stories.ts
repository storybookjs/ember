import { html } from 'lit';
import { DogeCoin } from './DogeCoin';

export default {
  component: DogeCoin,
  title: 'Examples / Doge Coin',
  argTypes: {
    flip: {
      type: { name: 'boolean', required: false },
      defaultValue: true,
    },
  },
};

const Template = ({ flip }) => html`<doge-coin .flip=${flip}></doge-coin>`;

export const Default = Template.bind({});
