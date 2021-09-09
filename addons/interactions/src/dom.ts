import { once } from '@storybook/client-logger';
import * as dom from '@testing-library/dom';
import dedent from 'ts-dedent';
import { instrument } from './instrument';

const instrumented = instrument(dom);

const { screen: _screen } = instrumented;
Object.defineProperty(instrumented, 'screen', {
  get() {
    once.warn(dedent`
      You are using Testing Library's \`screen\` object. Use \`within(canvasElement)\` instead.

      More info: https://storybook.js.org/docs/react/essentials/interactions
    `);
    return _screen;
  },
});

// console.log(Object.keys(dom).join(',\n'))
export const {
  buildQueries,
  configure,
  createEvent,
  findAllByAltText,
  findAllByDisplayValue,
  findAllByLabelText,
  findAllByPlaceholderText,
  findAllByRole,
  findAllByTestId,
  findAllByText,
  findAllByTitle,
  findByAltText,
  findByDisplayValue,
  findByLabelText,
  findByPlaceholderText,
  findByRole,
  findByTestId,
  findByText,
  findByTitle,
  fireEvent,
  getAllByAltText,
  getAllByDisplayValue,
  getAllByLabelText,
  getAllByPlaceholderText,
  getAllByRole,
  getAllByTestId,
  getAllByText,
  getAllByTitle,
  getByAltText,
  getByDisplayValue,
  getByLabelText,
  getByPlaceholderText,
  getByRole,
  getByTestId,
  getByText,
  getByTitle,
  getConfig,
  getDefaultNormalizer,
  getElementError,
  getMultipleElementsFoundError,
  getNodeText,
  getQueriesForElement,
  getRoles,
  getSuggestedQuery,
  isInaccessible,
  logDOM,
  logRoles,
  makeFindQuery,
  makeGetAllQuery,
  makeSingleQuery,
  prettyDOM,
  queries,
  queryAllByAltText,
  queryAllByAttribute,
  queryAllByDisplayValue,
  queryAllByLabelText,
  queryAllByPlaceholderText,
  queryAllByRole,
  queryAllByTestId,
  queryAllByText,
  queryAllByTitle,
  queryByAltText,
  queryByAttribute,
  queryByDisplayValue,
  queryByLabelText,
  queryByPlaceholderText,
  queryByRole,
  queryByTestId,
  queryByText,
  queryByTitle,
  queryHelpers,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
  wrapAllByQueryWithSuggestion,
  wrapSingleQueryWithSuggestion,
  prettyFormat,
} = instrumented;
