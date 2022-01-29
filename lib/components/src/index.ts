import { createElement, forwardRef, ElementType } from 'react';
import * as typography from './typography/components';

export { A } from './typography/elements/A';
export { Blockquote } from './typography/elements/Blockquote';
export { Code } from './typography/elements/Code';
export { Div } from './typography/elements/Div';
export { DL } from './typography/elements/DL';
export { H1 } from './typography/elements/H1';
export { H2 } from './typography/elements/H2';
export { H3 } from './typography/elements/H3';
export { H4 } from './typography/elements/H4';
export { H5 } from './typography/elements/H5';
export { H6 } from './typography/elements/H6';
export { HR } from './typography/elements/HR';
export { Img } from './typography/elements/Img';
export { LI } from './typography/elements/LI';
export { OL } from './typography/elements/OL';
export { P } from './typography/elements/P';
export { Pre } from './typography/elements/Pre';
export { Span } from './typography/elements/Span';
export { Table } from './typography/elements/Table';
export { TT } from './typography/elements/TT';
export { UL } from './typography/elements/UL';

export { Badge } from './Badge/Badge';

// Typography
export { Link } from './typography/link/link';
export { DocumentWrapper } from './typography/DocumentWrapper';
export type {
  SyntaxHighlighterProps,
  SyntaxHighlighterRendererProps,
} from './syntaxhighlighter/syntaxhighlighter-types';
export { SyntaxHighlighter } from './syntaxhighlighter/lazy-syntaxhighlighter';

// UI
export { ActionBar } from './ActionBar/ActionBar';
export { Spaced } from './spaced/Spaced';
export { Placeholder } from './placeholder/placeholder';
export { ScrollArea } from './ScrollArea/ScrollArea';
export { Zoom } from './Zoom/Zoom';

// Forms
export { Button } from './Button/Button';
export { Form } from './form/index';

// Tooltips
export { WithTooltip, WithTooltipPure } from './tooltip/lazy-WithTooltip';
export { TooltipMessage } from './tooltip/TooltipMessage';
export { TooltipNote } from './tooltip/TooltipNote';
export { TooltipLinkList } from './tooltip/TooltipLinkList';

// Toolbar and subcomponents
export { Tabs, TabsState, TabBar, TabWrapper } from './tabs/tabs';
export { IconButton, TabButton } from './bar/button';
export { Separator, interleaveSeparators } from './bar/separator';
export { Bar, FlexBar } from './bar/bar';
export { AddonPanel } from './addon-panel/addon-panel';

// Graphics
export type { IconsProps } from './icon/icon';
export { Icons, Symbols } from './icon/icon';
export { StorybookLogo } from './brand/StorybookLogo';
export { StorybookIcon } from './brand/StorybookIcon';

// Doc blocks
export * from './blocks';
export * from './controls';

// Loader
export { Loader } from './Loader/Loader';

// Utils
export { getStoryHref } from './utils/getStoryHref';

export * from './typography/DocumentFormatting';

// eslint-disable-next-line prefer-destructuring
export const components = typography.components;

const resetComponents: Record<string, ElementType> = {};

Object.keys(typography.components).forEach((key) => {
  resetComponents[key] = forwardRef((props, ref) => createElement(key, { ...props, ref }));
});

export { resetComponents };
