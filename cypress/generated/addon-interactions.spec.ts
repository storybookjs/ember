/* eslint-disable jest/no-identical-title */
import { onlyOn } from '@cypress/skip-test';

describe('addon-interactions', () => {
  before(() => {
    cy.visitStorybook();
  });

  const test = () => {
    // click on the button
    cy.navigateToStory('example-page', 'logged-in');

    cy.viewAddonPanel('Interactions');

    cy.getStoryElement().find('.welcome').should('contain.text', 'Welcome, Jane Doe!');

    cy.get('#tabbutton-interactions').contains(/(1)/).should('be.visible');
    cy.get('#storybook-panel-root')
      .contains(/userEvent.click/)
      .should('be.visible');
    cy.get('[data-testid=icon-done]').should('be.visible');
  };

  // Having multiple of onlyOn for the same test is a workaround instead
  // of having to use skipOn a long list of frameworks
  onlyOn('angular', () => {
    it('should have interactions', test);
  });

  onlyOn('react', () => {
    it('should have interactions', test);
  });
});
