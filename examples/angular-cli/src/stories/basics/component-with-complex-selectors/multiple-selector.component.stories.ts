import { MultipleSelectorComponent } from './multiple-selector.component';
import { AttributeSelectorComponent } from './attribute-selector.component';
import { ClassSelectorComponent } from './class-selector.component';

export default {
  title: 'Basics / Component / With Complex Selectors',
};

export const MultipleSelectors = () => ({
  component: MultipleSelectorComponent,
});

MultipleSelectors.storyName = 'multiple selectors';

export const AttributeSelectors = () => ({
  component: AttributeSelectorComponent,
});

AttributeSelectors.storyName = 'attribute selectors';

export const ClassSelectors = () => ({
  component: ClassSelectorComponent,
});

ClassSelectors.storyName = 'class selectors';
