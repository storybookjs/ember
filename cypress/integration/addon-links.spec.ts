import { visit } from '../helper';

describe('addon-links', () => {
  before(() => {
    visit('official-storybook?path=/story/addons-links-button--first');
  });

  it('should navigate on link', () => {
    cy.getStoryElement().find('button').should('contain.text', 'Go to "Second"').click();

    cy.url().should('include', 'path=/story/addons-links-button--second');

    cy.getStoryElement().find('button').should('contain.text', 'Go to "First"').click();

    cy.url().should('include', 'path=/story/addons-links-button--first');
  });
});
