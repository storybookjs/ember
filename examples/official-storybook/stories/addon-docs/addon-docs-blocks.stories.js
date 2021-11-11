import React from 'react';
import { Title, Subtitle, Description, Primary, ArgsTable, Stories } from '@storybook/addon-docs';
import { DocgenButton } from '../../components/DocgenButton';
import BaseButton from '../../components/BaseButton';
import { ButtonGroup, SubGroup } from '../../components/ButtonGroup';

export default {
  title: 'Addons/Docs/stories docs blocks',
  component: DocgenButton,
  parameters: {
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle />
          <Description />
          <Primary />
          <ArgsTable />
          <Stories />
        </>
      ),
    },
  },
};

export const DefDocsPage = () => <div>Default docs page</div>;

export const SmallDocsPage = () => <div>Just primary story, </div>;

SmallDocsPage.parameters = {
  docs: {
    page: () => (
      <>
        <Title />
        <Primary />
      </>
    ),
  },
};

export const CheckBoxProps = () => <div>Primary props displayed with a check box </div>;

CheckBoxProps.parameters = {
  docs: {
    page: () => {
      const [showProps, setShowProps] = React.useState(false);
      return (
        <>
          <Title />
          <Subtitle />
          <Description />
          <Primary />
          <label>
            <input type="checkbox" checked={showProps} onChange={() => setShowProps(!showProps)} />
            <span>display props</span>
          </label>
          {showProps && <ArgsTable />}
        </>
      );
    },
  },
};

export const CustomLabels = () => <div>Display custom title, Subtitle, Description</div>;

CustomLabels.parameters = {
  docs: {
    page: () => (
      <>
        <Title>Custom title</Title>
        <Subtitle>Custom sub title</Subtitle>
        <Description>Custom description</Description>
        <Primary />
        <ArgsTable />
        <Stories title="Custom stories title" />
      </>
    ),
  },
};

export const CustomStoriesFilter = () => <div>Displays ALL stories (not excluding first one)</div>;

CustomStoriesFilter.parameters = {
  docs: {
    page: () => <Stories includePrimary />,
  },
};

export const MultipleComponents = () => (
  <ButtonGroup>
    <DocgenButton label="one" />
    <DocgenButton label="two" />
    <DocgenButton label="three" />
  </ButtonGroup>
);

MultipleComponents.storyName = 'Many Components';

MultipleComponents.parameters = {
  component: ButtonGroup,
  subcomponents: {
    SubGroup,
    'Docgen Button': DocgenButton,
    'Base Button': BaseButton,
  },
  docs: {
    page: () => (
      <>
        <Title />
        <Subtitle />
        <Description />
        <Primary name="Many Components" />
        <ArgsTable />
      </>
    ),
  },
};

export const ComponentsProps = () => <div>Display multiple prop tables in tabs</div>;

ComponentsProps.subcomponents = {
  'Docgen Button': DocgenButton,
  'Base Button': BaseButton,
};

ComponentsProps.parameters = {
  docs: {
    page: () => (
      <>
        <Title>Multiple prop tables</Title>
        <Description>
          Here's what happens when your component has some related components
        </Description>
        <ArgsTable
          components={{
            'ButtonGroup Custom': ButtonGroup,
            'Docgen Button': DocgenButton,
            'Base Button': BaseButton,
          }}
        />
      </>
    ),
  },
};
