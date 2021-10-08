describe('addon-action', () => {
  before(() => {
    cy.visitStorybook();
  });

  it('should have docs tab', () => {
    cy.navigateToStory('example-button', 'primary');
    cy.viewAddonTab('Docs');

    // MDX rendering
    cy.getDocsElement().find('h1').should('contain.text', 'Button');

    // inline story rendering
    cy.getDocsElement().find('button').should('contain.text', 'Button');

    cy.getDocsElement()
      .find('.docblock-code-toggle')
      .first()
      .should('contain.text', 'Show code')
      .click();

    cy.getDocsElement()
      .find('code.language-jsx')
      .first()
      .should(($div) => {
        const text = $div.text();
        expect(text).not.match(/^\(args\) => /);
      });
  });
});
