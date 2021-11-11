import React from 'react';
import { Typeset } from './Typeset';

export default {
  title: 'Docs/Typeset',
  component: Typeset,
};

const fontSizes = ['12px', '14px', '16px', '20px', '24px', '32px', '40px', '48px'];
const fontWeight = 900;
const fontFamily = 'monospace';

export const WithFontSizes = () => <Typeset fontSizes={fontSizes} />;
export const WithFontWeight = () => <Typeset fontSizes={fontSizes} fontWeight={fontWeight} />;
export const WithFontFamily = () => <Typeset fontSizes={fontSizes} fontFamily={fontFamily} />;
export const WithWeightText = () => (
  <Typeset fontSizes={fontSizes} fontWeight={fontWeight} sampleText="Heading" />
);
