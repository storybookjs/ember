import { SelectionSpecifier, Selection } from '@storybook/client-api/dist/ts3.9/new/types';

// TODO -- this import is wrong
import { getSelectionSpecifierFromPath, setPath } from '../url';

export class UrlStore {
  selectionSpecifier: SelectionSpecifier;

  selection: Selection;

  constructor() {
    const oldSpec = getSelectionSpecifierFromPath();

    if (!oldSpec) {
      this.selectionSpecifier = null;
    } else if (typeof oldSpec.storySpecifier === 'string') {
      this.selectionSpecifier = {
        ...oldSpec,
        storySpecifier: oldSpec.storySpecifier as string,
      };
    } else {
      const { name, kind: title } = oldSpec.storySpecifier;
      this.selectionSpecifier = {
        ...oldSpec,
        storySpecifier: { name, title },
      };
    }
  }

  setSelection(selection: Selection) {
    this.selection = selection;

    setPath(this.selection);
  }
}
