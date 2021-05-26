---
title: 'Code contributions'
---

If you're willing to fix a bug or add a new feature to [Storybook](https://github.com/storybookjs/storybook), the first step is to set up your development environment. This page outlines how to get set up to contribute to Storybook's code. For instructions on working with documentation, check the [documentation contribution](./documentation-updates.md) page. To contribute to the code snippets, check the [snippets contribution](./new-snippets.md) page.

## Initial setup

The first thing you need to do is [fork](https://docs.github.com/en/github/getting-started-with-github/quickstart/fork-a-repo) the Storybook repository. Afterward, you need to clone and build your fork locally. Run the following commands:

```shell
git clone https://github.com/your-username/storybook.git
cd storybook
yarn
yarn bootstrap --core
```

## Sanity check

Once you've completed the [initial setup](#initial-setup), you should have a fully functional version of Storybook built on your local machine. Before making any code changes, it's helpful to verify that everything is working as it should. More specifically, the test suite and examples.

Run the following command to execute the tests:

```shell
yarn test
```

Once the tests finish, check if the examples are working with the following commands:

```shell
cd examples/cra-ts-essentials
yarn storybook
```

<div class="aside">
💡 The Storybook monorepo contains various example projects, each corresponding to a different framework and environment, and they are commonly used as additional tooling to test new features.
</div>

If everything is working as it should, you should see the `example/cra-ts-essentials` Storybook running.

![Example Storybook running](./storybook-cra-examples-optimized.png)

## Start developing

Now that you've [verified your setup](#sanity-check), it's time to jump into code. The simplest way to do this is to run one of the examples in one terminal window and the interactive build process in a separate terminal.

Assuming you're still running the `examples/cra-ts-essentials` from the previous step, open a new terminal and navigate to the root of the Storybook monorepo. Then, create a new branch with the following command:

```shell
git checkout -b my-first-storybook-contribution
```

Run the build process with:

```shell
yarn build
```

When asked if you want to start the build in `watch` mode, answer **yes** to develop in interactive mode. Afterward, choose which packages you want to build. For example, if you're going to work on a feature for `@storybook/addon-docs`, you might want to select `@storybook/addon-docs` and `@storybook/components`.

![Storybook package selector](./storybook-build-packages-selection-optimized.png)

If the work you'll be doing affects the `Preview` (the innermost Storybook `iframe`, where the stories are displayed), it will automatically refresh one to two seconds after you save.

Otherwise, if it affects the `Manager` (the outermost Storybook `iframe` where the addons are displayed), you'll need to refresh manually after saving.

![Storybook UI](./storybook-manager-preview.jpg)

## Check your work

When you're done with your work, we encourage you to include documentation and tests as appropriate. If you don't, we'll add a friendly reminder when you submit your pull request. 🧐

### Add stories

Adding a story or set of stories to an example app is a great way to test your work. If you're modifying part of Storybook's core, or one of the addons, there's probably a set of stories you can add to the [`official-storybook`](../../examples/official-storybook). If you're modifying something related to a specific framework, they have their own examples in the monorepo. For instance, [`examples/vue-kitchen-sink`](../../examples/vue-kitchen-sink) is a natural place to add stories for `@storybook/vue`, [`examples/angular-cli`](../../examples/angular-cli) for `@storybook/angular`, and so on.

### Add tests

Unit tests are also part of our test strategy. Therefore, we encourage you to use the following naming convention:

```
+-- parentFolder
|   +-- [filename].ts
|   +-- [filename].test.ts
```

## Submit your contribution

Before submitting your contribution, we recommend that you run the test suite one last time with:

```sh
yarn test
```

<div class="aside">
💡  Storybook uses <a href="https://jestjs.io/"><code>jest</code></a> as part of the testing suite, if you notice that the snapshot tests fail you can re-run and update them with <code>yarn test --update</code>.
</div>

Doing this prevents last-minute bugs and is also a great way to get your contribution merged faster once you submit your pull request. Failing to do so will lead to one of the maintainers mark the pull request with the **Work in Progress** label until all tests pass.

Once the test suite finishes, it's time to commit, push and open a pull request against Storybook's `next` (default) branch. This branch is where all active development happens and is associated with the latest prerelease version (e.g., `6.3.0-alpha.25`).

If your contribution focus on a bugfix and you want it featured in the next stable release, mention it in the pull request description. We'll try to get it in if it appears to be non-disruptive and fixes a critical bug.

## Working with reproductions

We strongly encourage contributors to create reproductions for their issues. In the same way, it's possible to [develop interactively](#start-developing) against example projects in the monorepo; it's also possible to develop against a reproduction repository.

To do so, run the following command in the root of the monorepo:

```sh
npx sb@next link https://github.com/your-username/your-project.git
```

This command creates a project `../storybook-repros/your-project`, and automatically links it to your local Storybook code. After connecting it, you should be able to run Storybook and develop as mentioned [above](#start-developing).

If you already have a reproduction on your local machine, you can similarly link it to your monorepo dev setup with the `--local` flag:

```sh
npx sb@next link --local /path/to/local-repro-directory
```

## Troubleshooting

<details>

<summary>`yarn dev` watches everything but is resource-intensive</summary>

It's troublesome to know which packages you're going to change ahead of time, and watching all of them can be highly demanding, even on modern machines. If you're working on a powerful enough machine, you can use `yarn dev` instead of `yarn build`.

</details>
