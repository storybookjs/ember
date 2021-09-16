import { Component, ComponentFactoryResolver, ElementRef } from '@angular/core';

@Component({
  selector: 'storybook-attribute-selector[foo=bar]',
  template: `<h3>Attribute selector</h3>
    Selector: {{ selectors }} <br />
    Generated template: {{ generatedTemplate }}`,
})
export class AttributeSelectorComponent {
  generatedTemplate = '';

  selectors = '';

  constructor(public el: ElementRef, private resolver: ComponentFactoryResolver) {
    const factory = this.resolver.resolveComponentFactory(AttributeSelectorComponent);
    this.selectors = factory.selector;
    this.generatedTemplate = el.nativeElement.outerHTML;
  }
}
