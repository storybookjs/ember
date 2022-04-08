/*
 * We added these types so we can be fairly confident that we introduce no breaking changes
 * We should remove this file in 7.0
 */

import { Interpolation } from '@emotion/react';

export type PropsOf<C extends keyof JSX.IntrinsicElements | React.JSXElementConstructor<any>> =
  JSX.LibraryManagedAttributes<C, React.ComponentPropsWithRef<C>>;

export type AddOptionalTo<T, U> = DistributiveOmit<T, U> & Partial<Pick<T, Extract<keyof T, U>>>;

type DistributiveOmit<T, U> = T extends any ? Pick<T, Exclude<keyof T, U>> : never;
type Overwrapped<T, U> = Pick<T, Extract<keyof T, keyof U>>;

type JSXInEl = JSX.IntrinsicElements;
type ReactClassPropKeys = keyof React.ClassAttributes<any>;

type WithTheme<P, T> = P extends { theme: infer Theme }
  ? P & { theme: Exclude<Theme, undefined> }
  : P & { theme: T };

interface StyledOptions {
  label?: string;
  shouldForwardProp?(propName: string): boolean;
  target?: string;
}

interface ComponentSelector {
  __emotion_styles: any;
}

export interface StyledComponent<InnerProps, StyleProps, Theme extends object>
  extends React.FC<InnerProps & DistributiveOmit<StyleProps, 'theme'> & { theme?: Theme }>,
    ComponentSelector {
  /**
   * @desc this method is type-unsafe
   */
  withComponent<NewTag extends keyof JSXInEl>(
    tag: NewTag
  ): StyledComponent<JSXInEl[NewTag], StyleProps, Theme>;
  withComponent<Tag extends React.ComponentType<any>>(
    tag: Tag
  ): StyledComponent<PropsOf<Tag>, StyleProps, Theme>;
}

interface CreateStyledComponentBaseThemeless<InnerProps, ExtraProps> {
  <
    StyleProps extends DistributiveOmit<
      Overwrapped<InnerProps, StyleProps>,
      ReactClassPropKeys
    > = DistributiveOmit<InnerProps & ExtraProps, ReactClassPropKeys>,
    Theme extends object = object
  >(
    ...styles: Array<Interpolation<WithTheme<StyleProps, Theme>>>
  ): StyledComponent<InnerProps, StyleProps, Theme>;
  <
    StyleProps extends DistributiveOmit<
      Overwrapped<InnerProps, StyleProps>,
      ReactClassPropKeys
    > = DistributiveOmit<InnerProps & ExtraProps, ReactClassPropKeys>,
    Theme extends object = object
  >(
    template: TemplateStringsArray,
    ...styles: Array<Interpolation<WithTheme<StyleProps, Theme>>>
  ): StyledComponent<InnerProps, StyleProps, Theme>;
}

interface CreateStyledComponentBaseThemed<
  InnerProps,
  ExtraProps,
  StyledInstanceTheme extends object
> {
  <
    StyleProps extends DistributiveOmit<
      Overwrapped<InnerProps, StyleProps>,
      ReactClassPropKeys
    > = DistributiveOmit<InnerProps & ExtraProps, ReactClassPropKeys>
  >(
    ...styles: Array<Interpolation<WithTheme<StyleProps, StyledInstanceTheme>>>
  ): StyledComponent<InnerProps, StyleProps, StyledInstanceTheme>;
  <
    StyleProps extends DistributiveOmit<
      Overwrapped<InnerProps, StyleProps>,
      ReactClassPropKeys
    > = DistributiveOmit<InnerProps & ExtraProps, ReactClassPropKeys>
  >(
    template: TemplateStringsArray,
    ...styles: Array<Interpolation<WithTheme<StyleProps, StyledInstanceTheme>>>
  ): StyledComponent<InnerProps, StyleProps, StyledInstanceTheme>;
}

type CreateStyledComponentBase<InnerProps, ExtraProps, StyledInstanceTheme extends object> =
  // this "reversed" condition checks if StyledInstanceTheme was already parametrized when using CreateStyled
  object extends StyledInstanceTheme
    ? CreateStyledComponentBaseThemeless<InnerProps, ExtraProps>
    : CreateStyledComponentBaseThemed<InnerProps, ExtraProps, StyledInstanceTheme>;

type CreateStyledComponentIntrinsic<Tag extends keyof JSXInEl, ExtraProps, Theme extends object> =
  CreateStyledComponentBase<JSXInEl[Tag], ExtraProps, Theme>;
type CreateStyledComponentExtrinsic<
  Tag extends React.ComponentType<any>,
  ExtraProps,
  Theme extends object
> = CreateStyledComponentBase<PropsOf<Tag>, ExtraProps, Theme>;

interface StyledTags<Theme extends object> {
  /**
   * @desc
   * HTML tags
   */
  a: CreateStyledComponentIntrinsic<'a', {}, Theme>;
  abbr: CreateStyledComponentIntrinsic<'abbr', {}, Theme>;
  address: CreateStyledComponentIntrinsic<'address', {}, Theme>;
  area: CreateStyledComponentIntrinsic<'area', {}, Theme>;
  article: CreateStyledComponentIntrinsic<'article', {}, Theme>;
  aside: CreateStyledComponentIntrinsic<'aside', {}, Theme>;
  audio: CreateStyledComponentIntrinsic<'audio', {}, Theme>;
  b: CreateStyledComponentIntrinsic<'b', {}, Theme>;
  base: CreateStyledComponentIntrinsic<'base', {}, Theme>;
  bdi: CreateStyledComponentIntrinsic<'bdi', {}, Theme>;
  bdo: CreateStyledComponentIntrinsic<'bdo', {}, Theme>;
  big: CreateStyledComponentIntrinsic<'big', {}, Theme>;
  blockquote: CreateStyledComponentIntrinsic<'blockquote', {}, Theme>;
  body: CreateStyledComponentIntrinsic<'body', {}, Theme>;
  br: CreateStyledComponentIntrinsic<'br', {}, Theme>;
  button: CreateStyledComponentIntrinsic<'button', {}, Theme>;
  canvas: CreateStyledComponentIntrinsic<'canvas', {}, Theme>;
  caption: CreateStyledComponentIntrinsic<'caption', {}, Theme>;
  cite: CreateStyledComponentIntrinsic<'cite', {}, Theme>;
  code: CreateStyledComponentIntrinsic<'code', {}, Theme>;
  col: CreateStyledComponentIntrinsic<'col', {}, Theme>;
  colgroup: CreateStyledComponentIntrinsic<'colgroup', {}, Theme>;
  data: CreateStyledComponentIntrinsic<'data', {}, Theme>;
  datalist: CreateStyledComponentIntrinsic<'datalist', {}, Theme>;
  dd: CreateStyledComponentIntrinsic<'dd', {}, Theme>;
  del: CreateStyledComponentIntrinsic<'del', {}, Theme>;
  details: CreateStyledComponentIntrinsic<'details', {}, Theme>;
  dfn: CreateStyledComponentIntrinsic<'dfn', {}, Theme>;
  dialog: CreateStyledComponentIntrinsic<'dialog', {}, Theme>;
  div: CreateStyledComponentIntrinsic<'div', {}, Theme>;
  dl: CreateStyledComponentIntrinsic<'dl', {}, Theme>;
  dt: CreateStyledComponentIntrinsic<'dt', {}, Theme>;
  em: CreateStyledComponentIntrinsic<'em', {}, Theme>;
  embed: CreateStyledComponentIntrinsic<'embed', {}, Theme>;
  fieldset: CreateStyledComponentIntrinsic<'fieldset', {}, Theme>;
  figcaption: CreateStyledComponentIntrinsic<'figcaption', {}, Theme>;
  figure: CreateStyledComponentIntrinsic<'figure', {}, Theme>;
  footer: CreateStyledComponentIntrinsic<'footer', {}, Theme>;
  form: CreateStyledComponentIntrinsic<'form', {}, Theme>;
  h1: CreateStyledComponentIntrinsic<'h1', {}, Theme>;
  h2: CreateStyledComponentIntrinsic<'h2', {}, Theme>;
  h3: CreateStyledComponentIntrinsic<'h3', {}, Theme>;
  h4: CreateStyledComponentIntrinsic<'h4', {}, Theme>;
  h5: CreateStyledComponentIntrinsic<'h5', {}, Theme>;
  h6: CreateStyledComponentIntrinsic<'h6', {}, Theme>;
  head: CreateStyledComponentIntrinsic<'head', {}, Theme>;
  header: CreateStyledComponentIntrinsic<'header', {}, Theme>;
  hgroup: CreateStyledComponentIntrinsic<'hgroup', {}, Theme>;
  hr: CreateStyledComponentIntrinsic<'hr', {}, Theme>;
  html: CreateStyledComponentIntrinsic<'html', {}, Theme>;
  i: CreateStyledComponentIntrinsic<'i', {}, Theme>;
  iframe: CreateStyledComponentIntrinsic<'iframe', {}, Theme>;
  img: CreateStyledComponentIntrinsic<'img', {}, Theme>;
  input: CreateStyledComponentIntrinsic<'input', {}, Theme>;
  ins: CreateStyledComponentIntrinsic<'ins', {}, Theme>;
  kbd: CreateStyledComponentIntrinsic<'kbd', {}, Theme>;
  keygen: CreateStyledComponentIntrinsic<'keygen', {}, Theme>;
  label: CreateStyledComponentIntrinsic<'label', {}, Theme>;
  legend: CreateStyledComponentIntrinsic<'legend', {}, Theme>;
  li: CreateStyledComponentIntrinsic<'li', {}, Theme>;
  link: CreateStyledComponentIntrinsic<'link', {}, Theme>;
  main: CreateStyledComponentIntrinsic<'main', {}, Theme>;
  map: CreateStyledComponentIntrinsic<'map', {}, Theme>;
  mark: CreateStyledComponentIntrinsic<'mark', {}, Theme>;
  /**
   * @desc
   * marquee tag is not supported by @types/react
   */
  // 'marquee': CreateStyledComponentIntrinsic<'marquee', {}, Theme>;
  menu: CreateStyledComponentIntrinsic<'menu', {}, Theme>;
  menuitem: CreateStyledComponentIntrinsic<'menuitem', {}, Theme>;
  meta: CreateStyledComponentIntrinsic<'meta', {}, Theme>;
  meter: CreateStyledComponentIntrinsic<'meter', {}, Theme>;
  nav: CreateStyledComponentIntrinsic<'nav', {}, Theme>;
  noscript: CreateStyledComponentIntrinsic<'noscript', {}, Theme>;
  object: CreateStyledComponentIntrinsic<'object', {}, Theme>;
  ol: CreateStyledComponentIntrinsic<'ol', {}, Theme>;
  optgroup: CreateStyledComponentIntrinsic<'optgroup', {}, Theme>;
  option: CreateStyledComponentIntrinsic<'option', {}, Theme>;
  output: CreateStyledComponentIntrinsic<'output', {}, Theme>;
  p: CreateStyledComponentIntrinsic<'p', {}, Theme>;
  param: CreateStyledComponentIntrinsic<'param', {}, Theme>;
  picture: CreateStyledComponentIntrinsic<'picture', {}, Theme>;
  pre: CreateStyledComponentIntrinsic<'pre', {}, Theme>;
  progress: CreateStyledComponentIntrinsic<'progress', {}, Theme>;
  q: CreateStyledComponentIntrinsic<'q', {}, Theme>;
  rp: CreateStyledComponentIntrinsic<'rp', {}, Theme>;
  rt: CreateStyledComponentIntrinsic<'rt', {}, Theme>;
  ruby: CreateStyledComponentIntrinsic<'ruby', {}, Theme>;
  s: CreateStyledComponentIntrinsic<'s', {}, Theme>;
  samp: CreateStyledComponentIntrinsic<'samp', {}, Theme>;
  script: CreateStyledComponentIntrinsic<'script', {}, Theme>;
  section: CreateStyledComponentIntrinsic<'section', {}, Theme>;
  select: CreateStyledComponentIntrinsic<'select', {}, Theme>;
  small: CreateStyledComponentIntrinsic<'small', {}, Theme>;
  source: CreateStyledComponentIntrinsic<'source', {}, Theme>;
  span: CreateStyledComponentIntrinsic<'span', {}, Theme>;
  strong: CreateStyledComponentIntrinsic<'strong', {}, Theme>;
  style: CreateStyledComponentIntrinsic<'style', {}, Theme>;
  sub: CreateStyledComponentIntrinsic<'sub', {}, Theme>;
  summary: CreateStyledComponentIntrinsic<'summary', {}, Theme>;
  sup: CreateStyledComponentIntrinsic<'sup', {}, Theme>;
  table: CreateStyledComponentIntrinsic<'table', {}, Theme>;
  tbody: CreateStyledComponentIntrinsic<'tbody', {}, Theme>;
  td: CreateStyledComponentIntrinsic<'td', {}, Theme>;
  textarea: CreateStyledComponentIntrinsic<'textarea', {}, Theme>;
  tfoot: CreateStyledComponentIntrinsic<'tfoot', {}, Theme>;
  th: CreateStyledComponentIntrinsic<'th', {}, Theme>;
  thead: CreateStyledComponentIntrinsic<'thead', {}, Theme>;
  time: CreateStyledComponentIntrinsic<'time', {}, Theme>;
  title: CreateStyledComponentIntrinsic<'title', {}, Theme>;
  tr: CreateStyledComponentIntrinsic<'tr', {}, Theme>;
  track: CreateStyledComponentIntrinsic<'track', {}, Theme>;
  u: CreateStyledComponentIntrinsic<'u', {}, Theme>;
  ul: CreateStyledComponentIntrinsic<'ul', {}, Theme>;
  var: CreateStyledComponentIntrinsic<'var', {}, Theme>;
  video: CreateStyledComponentIntrinsic<'video', {}, Theme>;
  wbr: CreateStyledComponentIntrinsic<'wbr', {}, Theme>;

  /**
   * @desc
   * SVG tags
   */
  circle: CreateStyledComponentIntrinsic<'circle', {}, Theme>;
  clipPath: CreateStyledComponentIntrinsic<'clipPath', {}, Theme>;
  defs: CreateStyledComponentIntrinsic<'defs', {}, Theme>;
  ellipse: CreateStyledComponentIntrinsic<'ellipse', {}, Theme>;
  foreignObject: CreateStyledComponentIntrinsic<'foreignObject', {}, Theme>;
  g: CreateStyledComponentIntrinsic<'g', {}, Theme>;
  image: CreateStyledComponentIntrinsic<'image', {}, Theme>;
  line: CreateStyledComponentIntrinsic<'line', {}, Theme>;
  linearGradient: CreateStyledComponentIntrinsic<'linearGradient', {}, Theme>;
  mask: CreateStyledComponentIntrinsic<'mask', {}, Theme>;
  path: CreateStyledComponentIntrinsic<'path', {}, Theme>;
  pattern: CreateStyledComponentIntrinsic<'pattern', {}, Theme>;
  polygon: CreateStyledComponentIntrinsic<'polygon', {}, Theme>;
  polyline: CreateStyledComponentIntrinsic<'polyline', {}, Theme>;
  radialGradient: CreateStyledComponentIntrinsic<'radialGradient', {}, Theme>;
  rect: CreateStyledComponentIntrinsic<'rect', {}, Theme>;
  stop: CreateStyledComponentIntrinsic<'stop', {}, Theme>;
  svg: CreateStyledComponentIntrinsic<'svg', {}, Theme>;
  text: CreateStyledComponentIntrinsic<'text', {}, Theme>;
  tspan: CreateStyledComponentIntrinsic<'tspan', {}, Theme>;
}

interface BaseCreateStyled<Theme extends object = any> {
  <Tag extends React.ComponentType<any>, ExtraProps = {}>(
    tag: Tag,
    options?: StyledOptions
  ): CreateStyledComponentExtrinsic<Tag, ExtraProps, Theme>;

  <Tag extends keyof JSXInEl, ExtraProps = {}>(
    tag: Tag,
    options?: StyledOptions
  ): CreateStyledComponentIntrinsic<Tag, ExtraProps, Theme>;
}

export interface CreateStyled<Theme extends object = any>
  extends BaseCreateStyled<Theme>,
    StyledTags<Theme> {}
