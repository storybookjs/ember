import global from 'global';
import { ZoomElement } from './ZoomElement';
import { ZoomIFrame } from './ZoomIFrame';

const { window: globalWindow } = global;

export const browserSupportsCssZoom = (): boolean => {
  try {
    return (
      globalWindow.document.implementation.createHTMLDocument('').body.style.zoom !== undefined
    );
  } catch (error) {
    return false;
  }
};

export const Zoom = {
  Element: ZoomElement,
  IFrame: ZoomIFrame,
};
