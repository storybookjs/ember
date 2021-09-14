describe('addon-action', () => {
  before(() => {
    cy.visitStorybook();
  });

  it('should have docs tab', () => {
    cy.navigateToStory('example-button', 'primary');
    cy.viewAddonTab('Docs');
    cy.getDocsElement().find('h1').should('contain.text', 'Button');
  });
});
