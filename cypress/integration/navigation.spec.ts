import { visit } from '../helper';

describe('Navigation', () => {
  before(() => {
    visit('official-storybook');
  });

  it('should search navigation item', () => {
    cy.get('#storybook-explorer-searchfield').click({ force: true });
    cy.get('#storybook-explorer-searchfield').clear();
    cy.get('#storybook-explorer-searchfield').type('syntax');

    cy.get('#storybook-explorer-menu button')
      .should('contain', 'SyntaxHighlighter')
      .and('not.contain', 'a11y');
  });

  it('should display no results after searching a non-existing navigation item', () => {
    cy.get('#storybook-explorer-searchfield').click({ force: true });
    cy.get('#storybook-explorer-searchfield').clear();
    cy.get('#storybook-explorer-searchfield').type('zzzzzzzzzz');

    cy.get('#storybook-explorer-menu button').should('be.hidden');
  });
});

describe('Routing', () => {
  it('should navigate to story addons-a11y-basebutton--default', () => {
    visit('official-storybook');

    cy.get('#addons-a11y-basebutton--label').click({ force: true });
    cy.url().should('include', 'path=/story/addons-a11y-basebutton--label');
  });

  it('should directly visit a certain story and render correctly', () => {
    visit('official-storybook/?path=/story/addons-a11y-basebutton--label');

    cy.getStoryElement().should('contain.text', 'Testing the a11y addon');
  });
});
