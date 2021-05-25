describe('addon-controls', () => {
  it('should change component when changing controls', () => {
    cy.visitStorybook();

    cy.navigateToStory('example-button', 'Primary');

    cy.viewAddonPanel('Controls');

    // Text input: Label
    cy.getStoryElement().find('button').should('contain.text', 'Button');
    cy.get('textarea[name=label]').clear().type('Hello world');
    cy.getStoryElement().find('button').should('contain.text', 'Hello world');

    // Args in URL
    cy.url().should('include', 'args=label:Hello+world');

    // Boolean toggle: Primary/secondary
    cy.getStoryElement().find('button').should('have.css', 'background-color', 'rgb(30, 167, 253)');
    cy.get('input[name=primary]').click();
    cy.getStoryElement().find('button').should('have.css', 'background-color', 'rgba(0, 0, 0, 0)');

    // Color picker: Background color
    cy.get('input[placeholder="Choose color..."]').type('red');
    cy.getStoryElement().find('button').should('have.css', 'background-color', 'rgb(255, 0, 0)');

    // TODO: enable this once the controls for size are aligned in all CLI templates.
    // Radio buttons: Size
    // cy.getStoryElement().find('button').should('have.css', 'font-size', '14px');
    // cy.get('label[for="size-large"]').click();
    // cy.getStoryElement().find('button').should('have.css', 'font-size', '16px');

    // Reset controls: assert that the component is back to original state
    cy.get('button[title="Reset controls"]').click();
    cy.getStoryElement().find('button').should('have.css', 'font-size', '14px');
    cy.getStoryElement().find('button').should('have.css', 'background-color', 'rgb(30, 167, 253)');
    cy.getStoryElement().find('button').should('contain.text', 'Button');
  });

  it('should apply controls automatically when passed via url', () => {
    cy.visit('/', {
      qs: {
        path: '/story/example-button--primary',
        args: 'label:Hello world',
      },
    });

    cy.getStoryElement().find('button').should('contain.text', 'Hello world');
  });
});
