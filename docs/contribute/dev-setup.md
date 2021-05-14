---
title: 'Dev setup'
---

To fix a bug or add a feature in [Storybook's monorepo](https://github.com/storybookjs/storybook), the first step is to set up your development environment.

## Initial setup

The following command downloads and builds the most recent development version of Storybook on your local machine:

```sh
git clone https://github.com/storybookjs/storybook.git
cd storybook
yarn bootstrap --core
```

> **_Note:_** On Windows, you may need to run `yarn` before `yarn bootstrap`!

## Sanity check

After [the initial setup](#initial-setup) you should have a fully built version of Storybook on your local machine. At this point, i's useful to verify that things are working, both with automated tests and by hand.

First, run the unit tests:

```sh
yarn test
```

Then, run an example project:

```
cd examples/cra-ts-essentials
yarn storybook
```

There are a bunch of example projects corresponding to different frameworks and app environments. They automatically run against the code in the monorepo.

## Interactive development

Now that you've [verified your setup](#sanity-check), it's time to jump into code. The easiest way to do this is to have one of the examples running in one terminal window, and to have an interactive build process running in another terminal.

Assuming, you're still running `examples/cra-ts-essentials` from the previous step, open a new terminal and run the build process there from the root of the Storybook monorepo:

```sh
yarn build
```

Select the `watch` option to develop interactively. Then select one more libraries to build. For example, if you are developing a feature for `@storybook/addon-docs` you might want to select `@storybook/addon-docs` and `@storybook/components`.

<details>

<summary>`yarn dev` watches everything but is resource-intensive</summary>

It's a pain to have to know which packages you're going to edit ahead of time, but watching the entire package structure is prohibitively expensive on most machines. If you're on a fast machine or simply enjoy hearing your CPU fan spin up like a jet engine, you can use `yarn dev` instead of `yarn build`.

</details>

Now, when you edit a file in one of the watched packages, it will automatically re-build.

If the file affects the `preview` (the inner iframe of Storybook, where the stories contents live), the preview should automatically refresh a second or two after you save your changes.

If the file affects the `manager` (the outer iframe where the UI and addon panels live), you need to manually refresh the browser.

## Reproductions

Since May 2021 we're strongly encouraging users to create reproductions for their issues. Just like it's possible to [interactively develop](#interactive-development) against example projects in the storybook monorepo, it's also possible to interactively develop against a reproduction repo.

To do so, run the following command in the root of the Storybook monorepo:

```sh
npx sb@next link https://github.com/<some-user>/<some-project>.git
```

This will create a project `../storybook-repros/some-project`, and then automatically link it to your local Storybook code.

After the repro is linked, you should be able to run Storybook and develop interactively with the `yarn build` command just like in the previous section.

```sh
cd ../storybook-repros/some-project
yarn storybook
```

## Check your work

When you're done with your work, make sure you've added documentation and tests as appropriate. If you don't, we'll remind you in your PR. 😘
Our naming convention for tests is as follows:

```sh
# Proper naming convention and structure for ts tests files
+-- parentFolder
|   +-- [filename].ts
|   +-- [filename].test.ts
```

Before you push your changes it's useful to run the test suite one more time. A PR that has failing tests will be regarded as a “Work in Progress” and will not be merged until all tests pass.

```sh
yarn test
```

If snapshot tests are broken, you can update your snapshots using `yarn test --update`. Storybook uses `jest` for testing, so you can use any of the jest flags that you're used to.

## Submit a PR

Finally, submit a PR against the `next` (default) branch.

`next` is where all active development happens and corresponds to the latest prerelease of Storybook (e.g. `6.3.0-alpha.25`).

If you are contributing a bugfix and you want it patched back to the `master` branch, which is where the latest stable version lives (e.g. `6.2.9`), mention that in your PR. We'll try to get it in if the fix looks non-disruptive and corresponds to a critical bug.
