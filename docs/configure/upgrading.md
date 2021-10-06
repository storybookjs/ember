---
title: 'Upgrading Storybook'
---

The frontend ecosystem is a fast-moving place. Regular dependency upgrades are a way of life, whether it's upgrading a framework, library, tooling, or all of the above! Storybook provides a few resources to help ease the pain of upgrading.

## Upgrade script

The most common upgrade is Storybook itself. [Storybook releases](/releases) follow [Semantic Versioning](https://semver.org/). We publish patch releases with bugfixes continuously, minor versions of Storybook with new features every few months, and major versions of Storybook with breaking changes roughly once per year.

To help ease the pain of keeping Storybook up-to-date, we provide a command-line script:

```sh
npx sb upgrade
```

This upgrades all of the Storybook packages in your project to the latest stable version, performs confidence checks of your package versions, and checks for opportunities to run [automigrations](#automigrate) to automatically update your configuration.

<div class="aside">

In addition to running the command, we also recommend skimming [MIGRATION.md](https://github.com/storybookjs/storybook/blob/next/MIGRATION.md), an exhaustive log of relevant changes and deprecations that might affect your upgrade.

</div>

## Automigrate script

Storybook upgrades are not the only thing to consider: changes in the ecosystem also present challenges. For example, lots of frameworks ([Angular 12](https://angular.io/guide/updating-to-version-12#breaking-changes-in-angular-version-12), [Create React App v5](https://github.com/facebook/create-react-app/pull/11201), [NextJS](https://nextjs.org/docs/upgrading#webpack-5)) have recently migrated from [webpack 4 to webpack 5](https://webpack.js.org/migrate/5/), so even if you don't upgrade your Storybook version, you might need to update your configuration accordingly. That's what Automigrate is for:

```
npx sb@next automigrate
```

This runs a set of common configuration checks, explains what is potentially out-of-date, and offers to fix it for you automatically. It also points to the relevant documentation so you can learn more. This gets run automatically as part of [`sb upgrade`](#upgrade-script), but it's also available on its own in case you don't want to upgrade Storybook.

## Prereleases

In addition to the above, Storybook is under constant development, and we publish pre-release versions almost daily. Pre-releases are the best way to try out new features before they are generally available, and we do our best to keep them as stable as possible, although this is not always possible.

To upgrade to the latest pre-release:

```sh
npx sb@next upgrade --prerelease
```

If you'd like to downgrade to a stable version, manually edit the package version numbers in your `package.json` and re-install.
