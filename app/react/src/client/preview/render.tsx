import global from 'global';
import React, {
  Component as ReactComponent,
  FunctionComponent,
  ReactElement,
  StrictMode,
  Fragment,
} from 'react';
import ReactDOM, { version as reactDomVersion } from 'react-dom';

import { RenderContext } from '@storybook/store';
import { ArgsStoryFn } from '@storybook/csf';
import { gte, coerce } from '@storybook/semver';

import { StoryContext } from './types';
import { ReactFramework } from './types-6-0';

const { FRAMEWORK_OPTIONS } = global;

// TODO: Remove IRoot declaration as soon as @types/react v17.x is used
interface IRoot {
  render(children: React.ReactChild | Iterable<React.ReactNode>): void;
  unmount(): void;
}

// A map of all rendered React 18 nodes
const nodes = new Map<Element, IRoot>();

export const render: ArgsStoryFn<ReactFramework> = (args, context) => {
  const { id, component: Component } = context;
  if (!Component) {
    throw new Error(
      `Unable to render story ${id} as the component annotation is missing from the default export`
    );
  }

  return <Component {...args} />;
};

const renderElement = async (node: ReactElement, el: Element) =>
  new Promise((resolve) => {
    // Create Root Element conditionally for new React 18 Root Api
    const root = getReactRoot(el);

    if (root) {
      root.render(node);
      setTimeout(() => {
        resolve(null);
      }, 0);
    } else {
      ReactDOM.render(node, el, () => resolve(null));
    }
  });

const unmountElement = (el: Element) => {
  const root = nodes.get(el);
  if (root && FRAMEWORK_OPTIONS?.newRootApi) {
    root.unmount();
    nodes.delete(el);
  } else {
    ReactDOM.unmountComponentAtNode(el);
  }
};

const canUseReactRoot =
  gte(reactDomVersion, '18.0.0') || coerce(reactDomVersion)?.version === '18.0.0';

const getReactRoot = (el: Element): IRoot | null => {
  if (!FRAMEWORK_OPTIONS?.newRootApi) {
    return null;
  }

  if (!canUseReactRoot) {
    throw new Error(
      "Your React version doesn't support the new React Root Api. Please use react and react-dom in version 18.x or set the storybook feature 'newRootApi' to false"
    );
  }

  let root = nodes.get(el);

  if (!root) {
    // eslint-disable-next-line global-require
    root = require('react-dom/client').createRoot(el) as IRoot;
    nodes.set(el, root);
  }

  return root;
};

class ErrorBoundary extends ReactComponent<{
  showException: (err: Error) => void;
  showMain: () => void;
}> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidMount() {
    const { hasError } = this.state;
    const { showMain } = this.props;
    if (!hasError) {
      showMain();
    }
  }

  componentDidCatch(err: Error) {
    const { showException } = this.props;
    // message partially duplicates stack, strip it
    showException(err);
  }

  render() {
    const { hasError } = this.state;
    const { children } = this.props;

    return hasError ? null : children;
  }
}

const Wrapper = FRAMEWORK_OPTIONS?.strictMode ? StrictMode : Fragment;

export async function renderToDOM(
  {
    storyContext,
    unboundStoryFn,
    showMain,
    showException,
    forceRemount,
  }: RenderContext<ReactFramework>,
  domElement: HTMLElement
) {
  const Story = unboundStoryFn as FunctionComponent<StoryContext<ReactFramework>>;

  const content = (
    <ErrorBoundary showMain={showMain} showException={showException}>
      <Story {...storyContext} />
    </ErrorBoundary>
  );

  // For React 15, StrictMode & Fragment doesn't exists.
  const element = Wrapper ? <Wrapper>{content}</Wrapper> : content;

  // In most cases, we need to unmount the existing set of components in the DOM node.
  // Otherwise, React may not recreate instances for every story run.
  // This could leads to issues like below:
  // https://github.com/storybookjs/react-storybook/issues/81
  // (This is not the case when we change args or globals to the story however)
  if (forceRemount) {
    unmountElement(domElement);
  }

  await renderElement(element, domElement);
}
