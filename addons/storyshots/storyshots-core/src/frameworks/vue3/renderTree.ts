import * as Vue from 'vue';
import global from 'global';
import dedent from 'ts-dedent';
import { app, activeStoryComponent } from '@storybook/vue3';

const { document } = global;

// This is cast as `any` to workaround type errors caused by Vue 2 types
const { h } = Vue as any;

let vm: any;
function getRenderedTree(story: any) {
  const component = story.render();

  const vnode = h(component, story.args);

  // Vue 3's Jest renderer throws if all of the required props aren't specified
  // So we try/catch and warn the user if they forgot to specify one in their args
  activeStoryComponent.value = vnode;
  if (!vm) {
    vm = app.mount(document.createElement('div'));
  }
  vm.$forceUpdate();
  return vm.$el;
}

export default getRenderedTree;
