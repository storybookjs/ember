import { skipOn } from '@cypress/skip-test';

describe('addon-action', () => {
  beforeEach(() => {
    cy.visitStorybook();
    cy.navigateToStory('example-button', 'primary');
    cy.viewAddonTab('Docs');
  });

  it('should have docs tab', () => {
    // MDX rendering
    cy.getDocsElement().find('h1').should('contain.text', 'Button');

    // inline story rendering
    cy.getDocsElement().find('button').should('contain.text', 'Button');
  });

  skipOn('vue3', () => {
    it('should provide source snippet', () => {
      cy.getDocsElement()
        .find('.docblock-code-toggle')
        .first()
        .should('contain.text', 'Show code')
        // use force click so cypress does not automatically scroll, making the source block visible on this step
        .click({ force: true });

      cy.getDocsElement()
        .find('pre.prismjs')
        .first()
        .should(($div) => {
          const text = $div.text();
          expect(text).not.match(/^\(args\) => /);
        });
    });
  });
});
