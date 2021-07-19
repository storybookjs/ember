import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { Story, Meta } from '@storybook/web-components';
import mdxNotes from './notes/notes.mdx';

export default {
  title: `Addons / Docs / Stories`,
} as Meta;

export const Basic: Story = () => html`<div>Click docs tab to see basic docs</div>`;

export const NoDocs: Story = () => html`<div>Click docs tab to see no docs error</div>`;
NoDocs.parameters = { docs: { page: null } };

export const LargerThanPreview: Story = () =>
  html`<div style=${styleMap({ width: '1000px', background: 'pink' })}>HUGE</div>`;

export const MdxOverride: Story = () => html`<div>Click docs tab to see MDX-overridden docs</div>`;
MdxOverride.parameters = {
  docs: { page: mdxNotes },
};

export const InlineOverride: Story = () =>
  html`<div>Click docs tab to see JSX-overridden docs</div>`;
InlineOverride.parameters = {
  docs: { page: () => html`<div>Hello docs</div>` },
};

export const DocsDisable: Story = () => html`<div>This story shouldn't show up in DocsPage</div>`;
DocsDisable.parameters = {
  docs: { disable: true },
};
