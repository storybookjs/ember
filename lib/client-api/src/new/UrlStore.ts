import Events from '@storybook/core-events';

import { Channel, SelectionSpecifier, Selection } from './types';
// TODO -- this import is wrong
import { getSelectionSpecifierFromPath, setPath } from '../../../core-client/src/preview/url';

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
