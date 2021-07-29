import { SelectionSpecifier, Selection } from '@storybook/client-api/dist/ts3.9/new/types';

// TODO -- this import is wrong
import { getSelectionSpecifierFromPath, setPath } from '../url';

export class UrlStore {
  selectionSpecifier: SelectionSpecifier;

  selection: Selection;

  constructor() {
    this.selectionSpecifier = getSelectionSpecifierFromPath();
  }

  setSelection(selection: Selection) {
    this.selection = selection;

    setPath(this.selection);
  }
}
