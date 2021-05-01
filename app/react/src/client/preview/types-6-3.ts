import { ComponentProps, JSXElementConstructor } from 'react';
import type { Story } from './types-6-0';

export * from './types-6-0';

/**
 * For the common case where a story is a simple component that receives args as props:
 *
 * ```tsx
 * const Template: ComponentStory<typeof Button> = (args) => <Button {...args} />
 * ```
 */
export type ComponentStory<
  T extends keyof JSX.IntrinsicElements | JSXElementConstructor<any>
> = Story<ComponentProps<T>>;
