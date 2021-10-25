import React from 'react';
import { Visualization } from '../../components/addon-measure/Visualization';

export default {
  title: 'Addons/Measure/BoxModel',
  parameters: {
    layout: 'fullscreen',
  },
};

const Template = (args) => <Visualization {...args} />;

export const MarginUniform = Template.bind({});
MarginUniform.args = {
  render: (ref) => (
    <div
      ref={ref}
      style={{
        width: 256,
        height: 256,
        margin: 16,
        outline: '1px solid black',
      }}
    />
  ),
};

export const MarginAsymmetric = Template.bind({});
MarginAsymmetric.args = {
  render: (ref) => (
    <div
      ref={ref}
      style={{
        outline: '1px solid black',
        width: 256,
        height: 256,
        margin: '16px 32px 64px 8px',
      }}
    />
  ),
};

export const PaddingUniform = Template.bind({});
PaddingUniform.args = {
  render: (ref) => (
    <div
      ref={ref}
      style={{
        width: 256,
        height: 256,
        padding: 16,
        outline: '1px solid black',
      }}
    />
  ),
};

export const PaddingAsymmetric = Template.bind({});
PaddingAsymmetric.args = {
  render: (ref) => (
    <div
      ref={ref}
      style={{
        outline: '1px solid black',
        width: 256,
        height: 256,
        padding: '16px 32px 64px 8px',
      }}
    />
  ),
};

export const BorderUniform = Template.bind({});
BorderUniform.args = {
  render: (ref) => (
    <div
      ref={ref}
      style={{
        outline: '1px solid black',
        width: 256,
        height: 256,
        border: '8px solid transparent',
      }}
    />
  ),
};

export const BorderAsymmetric = Template.bind({});
BorderAsymmetric.args = {
  render: (ref) => (
    <div
      ref={ref}
      style={{
        outline: '1px solid black',
        width: 256,
        height: 256,
        borderTop: '8px solid transparent',
        borderRight: '16px solid transparent',
        borderBottom: '32px solid transparent',
        borderLeft: '12px solid transparent',
      }}
    />
  ),
};

export const DecimalSizing = Template.bind({});
DecimalSizing.args = {
  render: (ref) => (
    <div
      ref={ref}
      style={{
        outline: '1px solid black',
        width: 250.100006103515625,
        height: 250.100006103515625,
      }}
    />
  ),
};
