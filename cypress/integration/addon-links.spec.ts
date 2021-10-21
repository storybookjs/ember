import { visit } from '../helper';

describe('addon-links', () => {
  before(() => {
    visit('official-storybook?path=/story/addons-links-button--first');
  });

  it('should navigate on link', () => {
    cy.getStoryElement()
      .find('button')
      .first()
      .should('contain.text', 'Go to "Second"')
      .click({ force: true });

    cy.url().should('include', 'path=/story/addons-links-button--second');

    cy.getStoryElement()
      .find('button')
      .first()
      .should('contain.text', 'Go to "First"')
      .click({ force: true });

    cy.url().should('include', 'path=/story/addons-links-button--first');
  });
});
