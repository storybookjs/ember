export default {
  title: 'Addons/Docs/transformSource',
  parameters: {
    docs: {
      transformSource(src, ctx) {
        return `// We transformed this!\n const example = ${src};`;
      },
    },
  },
};

export const Code = () => 'StoryType "CODE" story which has source transformed';
Code.parameters = {
  docs: { source: { type: 'code' } },
};

export const Dynamic = () => 'StoryType "DYNAMIC" story which has source transformed';
Dynamic.parameters = {
  docs: { source: { type: 'dynamic' } },
};

export const Auto = () => 'StoryType "AUTO" story which has source transformed';
Dynamic.parameters = {
  docs: { source: { type: 'auto' } },
};
