import { AbstractRenderer } from './AbstractRenderer';
import { DocsRenderer } from './DocsRenderer';
import { CanvasRenderer } from './CanvasRenderer';

type RenderType = 'canvas' | 'docs';
export class RendererFactory {
  private lastRenderType: RenderType;

  private rendererMap = new Map<string, AbstractRenderer>();

  public async getRendererInstance(storyId: string, targetDOMNode: HTMLElement) {
    const renderType = getRenderType(targetDOMNode);
    // keep only instances of the same type
    if (this.lastRenderType && this.lastRenderType !== renderType) {
      this.rendererMap.clear();
      await AbstractRenderer.resetPlatformBrowserDynamic();
    }

    if (!this.rendererMap.has(storyId)) {
      this.rendererMap.set(storyId, this.buildRenderer(storyId, renderType));
    }

    this.lastRenderType = renderType;
    return this.rendererMap.get(storyId);
  }

  private buildRenderer(storyId: string, renderType: RenderType) {
    if (renderType === 'docs') {
      return new DocsRenderer(storyId);
    }
    return new CanvasRenderer(storyId);
  }
}

export const getRenderType = (targetDOMNode: HTMLElement): RenderType => {
  return targetDOMNode.id === 'root' ? 'canvas' : 'docs';
};
