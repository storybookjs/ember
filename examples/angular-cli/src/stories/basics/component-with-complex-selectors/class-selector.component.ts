import { Component, ComponentFactoryResolver, ElementRef } from '@angular/core';

@Component({
  selector: 'storybook-class-selector.foo, storybook-class-selector.bar',
  template: `<h3>Class selector</h3>
    Selector: {{ selectors }} <br />
    Generated template: {{ generatedTemplate }}`,
})
export class ClassSelectorComponent {
  generatedTemplate = '';

  selectors = '';

  constructor(public el: ElementRef, private resolver: ComponentFactoryResolver) {
    const factory = this.resolver.resolveComponentFactory(ClassSelectorComponent);
    this.selectors = factory.selector;
    this.generatedTemplate = el.nativeElement.outerHTML;
  }
}
