import 'jest-specific-snapshot';
import dedent from 'ts-dedent';
import path from 'path';
import mdx from '@mdx-js/mdx';
import prettier from 'prettier';
import { createCompiler } from './sb-mdx-plugin';

function generate(content) {
  const code = mdx.sync(content, {
    // filepath: filePath,
    compilers: [createCompiler({})],
  });

  return prettier.format(code, {
    parser: 'babel',
    printWidth: 100,
    tabWidth: 2,
    bracketSpacing: true,
    trailingComma: 'es5',
    singleQuote: true,
  });
}

const fixturesDir = path.join(__dirname, '..', '..', '__testfixtures__', 'mdx');

const snap = (prefix) => path.join(fixturesDir, `${prefix}.output.snapshot`);

describe('docs-mdx-compiler-plugin', () => {
  it('component-args.mdx', () => {
    expect(
      generate(dedent`
        import { Button } from '@storybook/react/demo';
        import { Story, Meta } from '@storybook/addon-docs';

        <Meta title="Button" args={{ a: 1, b: 2 }} argTypes={{ a: { name: 'A' }, b: { name: 'B' } }} />

        # Args

        <Story name="component notes">
          <Button>Component notes</Button>
        </Story>
      `)
    ).toMatchSpecificSnapshot(snap('component-args'));
  });

  it('component-id.mdx', () => {
    expect(
      generate(dedent`
        import { Button } from '@storybook/react/demo';
        import { Story, Meta } from '@storybook/addon-docs';
        
        <Meta title="Button" component={Button} id="button-id" />
        
        <Story name="component notes">
          <Button>Component notes</Button>
        </Story>        
      `)
    ).toMatchSpecificSnapshot(snap('component-id'));
  });

  it('csf-imports.mdx', () => {
    expect(
      generate(dedent`
        import { Story, Meta, Canvas } from '@storybook/addon-docs';
        import { Welcome, Button } from '@storybook/angular/demo';
        import * as MyStories from './My.stories';
        import { Other } from './Other.stories';
        
        <Meta title="MDX/CSF imports" />
        
        # Stories from CSF imports
        
        <Story story={MyStories.Basic} />
        
        <Canvas>
          <Story story={Other} />
        </Canvas>
        
        <Story name="renamed" story={MyStories.Foo} />      
      `)
    ).toMatchSpecificSnapshot(snap('csf-imports'));
  });

  it('decorators.mdx', () => {
    expect(
      generate(dedent`
        import { Button } from '@storybook/react/demo';
        import { Story, Meta } from '@storybook/addon-docs';

        <Meta
          title="Button"
          decorators={[(storyFn) => <div style={{ backgroundColor: 'yellow' }}>{storyFn()}</div>]}
        />

        # Decorated story

        <Story name="one" decorators={[(storyFn) => <div className="local">{storyFn()}</div>]}>
          <Button>One</Button>
        </Story>
      `)
    ).toMatchSpecificSnapshot(snap('decorators'));
  });

  it('docs-only.mdx', () => {
    expect(
      generate(dedent`
        import { Meta } from '@storybook/addon-docs';

        <Meta title="docs-only" />

        # Documentation only

        This is a documentation-only MDX file which generates a dummy 'docsOnly: true' story.
      `)
    ).toMatchSpecificSnapshot(snap('docs-only'));
  });

  it('loaders.mdx', () => {
    expect(
      generate(dedent`
        import { Button } from '@storybook/react/demo';
        import { Story, Meta } from '@storybook/addon-docs';

        <Meta title="Button" loaders={[async () => ({ foo: 1 })]} />

        # Story with loader

        <Story name="one" loaders={[async () => ({ bar: 2 })]}>
          <Button>One</Button>
        </Story>
      `)
    ).toMatchSpecificSnapshot(snap('loaders'));
  });

  it('meta-quotes-in-title.mdx', () => {
    expect(
      generate(dedent`
        import { Meta } from '@storybook/addon-docs';

        <Meta title="Addons/Docs/what's in a title?" />
      `)
    ).toMatchSpecificSnapshot(snap('meta-quotes-in-title'));
  });

  it('non-story-exports.mdx', () => {
    expect(
      generate(dedent`
        import { Button } from '@storybook/react/demo';
        import { Story, Meta } from '@storybook/addon-docs';

        <Meta title="Button" />

        # Story definition

        <Story name="one">
          <Button>One</Button>
        </Story>

        export const two = 2;

        <Story name="hello story">
          <Button>Hello button</Button>
        </Story>
      `)
    ).toMatchSpecificSnapshot(snap('non-story-exports'));
  });

  it('parameters.mdx', () => {
    expect(
      generate(dedent`
        import { Button } from '@storybook/react/demo';
        import { Story, Meta } from '@storybook/addon-docs';

        <Meta title="Button" component={Button} parameters={{ notes: 'component notes' }} />

        <Story name="component notes">
          <Button>Component notes</Button>
        </Story>

        <Story name="story notes" parameters={{ notes: 'story notes' }}>
          <Button>Story notes</Button>
        </Story>
      `)
    ).toMatchSpecificSnapshot(snap('parameters'));
  });

  it('previews.mdx', () => {
    expect(
      generate(dedent`
        import { Button } from '@storybook/react/demo';
        import { Canvas, Story, Meta } from '@storybook/addon-docs';

        <Meta title="Button" component={Button} parameters={{ notes: 'component notes' }} />

        # Canvas

        Canvases can contain normal components, stories, and story references

        <Canvas>
          <Button>Just a button</Button>
          <Story name="hello button">
            <Button>Hello button</Button>
          </Story>
          <Story name="two">
            <Button>Two</Button>
          </Story>
          <Story id="welcome--welcome" />
        </Canvas>

        Canvas without a story

        <Canvas>
          <Button>Just a button</Button>
        </Canvas>
      `)
    ).toMatchSpecificSnapshot(snap('previews'));
  });

  it('story-args.mdx', () => {
    expect(
      generate(dedent`
        import { Button } from '@storybook/react/demo';
        import { Story, Meta } from '@storybook/addon-docs';

        <Meta title="Button" />

        # Args

        export const Template = (args) => <Button>Component notes</Button>;

        <Story
          name="component notes"
          args={{ a: 1, b: 2 }}
          argTypes={{ a: { name: 'A' }, b: { name: 'B' } }}
        >
          {Template.bind({})}
        </Story>
      `)
    ).toMatchSpecificSnapshot(snap('story-args'));
  });

  it('story-current.mdx', () => {
    expect(
      generate(dedent`
        import { Story } from '@storybook/addon-docs';

        # Current story

        <Story id="." />
      `)
    ).toMatchSpecificSnapshot(snap('story-current'));
  });

  it('story-def-text-only.mdx', () => {
    expect(
      generate(dedent`
        import { Story, Meta } from '@storybook/addon-docs';

        <Meta title="Text" />

        # Story definition

        <Story name="text">Plain text</Story>
      `)
    ).toMatchSpecificSnapshot(snap('story-def-text-only'));
  });

  it('story-definitions.mdx', () => {
    expect(
      generate(dedent`
        import { Button } from '@storybook/react/demo';
        import { Story, Meta } from '@storybook/addon-docs';
        
        <Meta title="Button" />
        
        # Story definition
        
        <Story name="one">
          <Button>One</Button>
        </Story>
        
        <Story name="hello story">
          <Button>Hello button</Button>
        </Story>
        
        <Story name="w/punctuation">
          <Button>with punctuation</Button>
        </Story>
        
        <Story name="1 fine day">
          <Button>starts with number</Button>
        </Story>
      `)
    ).toMatchSpecificSnapshot(snap('story-definitions'));
  });

  it('story-function-var.mdx', () => {
    expect(
      generate(dedent`
        import { Meta, Story } from '@storybook/addon-docs';

        <Meta title="story-function-var" />
        
        export const basicFn = () => <Button />;
        
        # Button
        
        I can define a story with the function defined in CSF:
        
        <Story name="basic">{basicFn}</Story>      
      `)
    ).toMatchSpecificSnapshot(snap('story-function-var'));
  });

  it('story-function.mdx', () => {
    expect(
      generate(dedent`
        <Story name="function" height="100px">
          {() => {
            const btn = document.createElement('button');
            btn.innerHTML = 'Hello Button';
            btn.addEventListener('click', action('Click'));
            return btn;
          }}
        </Story>
      `)
    ).toMatchSpecificSnapshot(snap('story-function'));
  });

  it('story-multiple-children.mdx', () => {
    expect(
      generate(dedent`
        import { Story, Meta } from '@storybook/addon-docs';

        <Meta title="Multiple" />
        
        # Multiple children
        
        <Story name="multiple children">
          <p>Hello Child #1</p>
          <p>Hello Child #2</p>
        </Story>
      `)
    ).toMatchSpecificSnapshot(snap('story-multiple-children'));
  });

  it('story-object.mdx', () => {
    expect(
      generate(dedent`
        import { Story, Meta } from '@storybook/addon-docs';
        import { Welcome, Button } from '@storybook/angular/demo';
        import { linkTo } from '@storybook/addon-links';
        
        <Meta title="MDX|Welcome" />
        
        # Story object
        
        <Story name="to storybook" height="300px">
          {{
            template: '<storybook-welcome-component (showApp)="showApp()"></storybook-welcome-component>',
            props: {
              showApp: linkTo('Button'),
            },
            moduleMetadata: {
              declarations: [Welcome],
            },
          }}
        </Story>
      `)
    ).toMatchSpecificSnapshot(snap('story-object'));
  });

  it('story-references.mdx', () => {
    expect(
      generate(dedent`
        import { Story } from '@storybook/addon-docs';

        # Story reference

        <Story id="welcome--welcome" />
      `)
    ).toMatchSpecificSnapshot(snap('story-references'));
  });

  it('title-template-string.mdx', () => {
    expect(
      generate(
        [
          "import { Meta, Story } from '@storybook/addon-docs';",
          "import { titleFunction } from '../title-generators';",
          '',
          // eslint-disable-next-line no-template-curly-in-string
          "<Meta title={`${titleFunction('template')}`} />",
        ].join('\n')
      )
    ).toMatchSpecificSnapshot(snap('title-template-string'));
  });

  it('vanilla.mdx', () => {
    expect(
      generate(dedent`
        import { Button } from '@storybook/react/demo';

        # Hello MDX

        This is some random content.

        <Button>Hello button</Button>
      `)
    ).toMatchSpecificSnapshot(snap('vanilla'));
  });

  it('errors on missing story props', async () => {
    await expect(async () =>
      generate(dedent`
        import { Button } from '@storybook/react/demo';
        import { Story, Meta } from '@storybook/addon-docs';
        
        <Meta title="Button" />
        
        # Bad story
        
        <Story>
          <Button>One</Button>
        </Story>      
      `)
    ).rejects.toThrow('Expected a Story name, id, or story attribute');
  });
});
