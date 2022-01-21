import React from 'react';
import { nameSpaceClassNames } from './DocumentFormatting';
import { A } from './elements/A';
import { Blockquote } from './elements/Blockquote';
import { Code } from './elements/Code';
import { Div } from './elements/Div';
import { DL } from './elements/DL';
import { H1 } from './elements/H1';
import { H2 } from './elements/H2';
import { H3 } from './elements/H3';
import { H4 } from './elements/H4';
import { H5 } from './elements/H5';
import { H6 } from './elements/H6';
import { HR } from './elements/HR';
import { Img } from './elements/Img';
import { LI } from './elements/LI';
import { OL } from './elements/OL';
import { P } from './elements/P';
import { Pre } from './elements/Pre';
import { Span } from './elements/Span';
import { Table } from './elements/Table';
import { TT } from './elements/TT';
import { UL } from './elements/UL';
import { ResetWrapper } from './ResetWrapper';

export const components = {
  h1: ((props) => <H1 {...nameSpaceClassNames(props, 'h1')} />) as typeof H1,
  h2: ((props) => <H2 {...nameSpaceClassNames(props, 'h2')} />) as typeof H2,
  h3: ((props) => <H3 {...nameSpaceClassNames(props, 'h3')} />) as typeof H3,
  h4: ((props) => <H4 {...nameSpaceClassNames(props, 'h4')} />) as typeof H4,
  h5: ((props) => <H5 {...nameSpaceClassNames(props, 'h5')} />) as typeof H5,
  h6: ((props) => <H6 {...nameSpaceClassNames(props, 'h6')} />) as typeof H6,
  pre: ((props) => <Pre {...nameSpaceClassNames(props, 'pre')} />) as typeof Pre,
  a: ((props) => <A {...nameSpaceClassNames(props, 'a')} />) as typeof A,
  hr: ((props) => <HR {...nameSpaceClassNames(props, 'hr')} />) as typeof HR,
  dl: ((props) => <DL {...nameSpaceClassNames(props, 'dl')} />) as typeof DL,
  blockquote: ((props) => (
    <Blockquote {...nameSpaceClassNames(props, 'blockquote')} />
  )) as typeof Blockquote,
  table: ((props) => <Table {...nameSpaceClassNames(props, 'table')} />) as typeof Table,
  img: ((props) => <Img {...nameSpaceClassNames(props, 'img')} />) as typeof Img,
  div: ((props) => <Div {...nameSpaceClassNames(props, 'div')} />) as typeof Div,
  span: ((props) => <Span {...nameSpaceClassNames(props, 'span')} />) as typeof Span,
  li: ((props) => <LI {...nameSpaceClassNames(props, 'li')} />) as typeof LI,
  ul: ((props) => <UL {...nameSpaceClassNames(props, 'ul')} />) as typeof UL,
  ol: ((props) => <OL {...nameSpaceClassNames(props, 'ol')} />) as typeof OL,
  p: ((props) => <P {...nameSpaceClassNames(props, 'p')} />) as typeof P,
  code: ((props) => <Code {...nameSpaceClassNames(props, 'code')} />) as typeof Code,
  tt: ((props) => <TT {...nameSpaceClassNames(props, 'tt')} />) as typeof TT,
  resetwrapper: ((props) => (
    <ResetWrapper {...nameSpaceClassNames(props, 'resetwrapper')} />
  )) as typeof ResetWrapper,
};
