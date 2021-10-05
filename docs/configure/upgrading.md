---
title: 'Upgrading Storybook'
---

The frontend ecosystem is a fast-moving place. Regular dependency upgrades are way of life, whether it's upgrading a framework, library, tooling, or all of the above! Storybook provides a few resources to help ease the pain of upgrading.

## Upgrade script

The most common upgrade is Storybook itself. Storybook follows [Semantic Versioning](https://semver.org/). We release patch releases with bugfixes continuously, minor versions of Storybook with new features every few months, and major versions of Storybook with breaking changes roughly once per year.

To help ease the pain of keeping Storybook up-to-date, we provide a command-line script:

```sh
npx sb@next upgrade
```

This upgrades all your Storybook packages to the latest stable version, perform sanity checks of your package versions, and also check for [automigrations](#automigrate) to automatically update your configuration.

<div class="aside">

In addition to running the command, we also recommend skimming [MIGRATION.md](https://github.com/storybookjs/storybook/blob/next/MIGRATION.md), an exhaustive log of changes relevant changes and deprecations that might affect your upgrade.

</div>

## Automigrate script

Storybook upgrades are not the only thing that can break your Storybook: changes in the ecosystem are also present challenges. For example, lots of frameworks (Angular 12, Create React App v5, NextJS) have recently migrated from webpack4 to webpack5, so even if you don't upgrade your Storybook version, you might need to update your configuration accordingly. That's what Automigrate is for:

```
npx sb@next automigrate
```

This runs a set of common configuration checks, explains what's potentially out of date, and offers to fix it for you automatically. It also points to the relevant documentation so you can learn more. This gets run automatically as part of `sb upgrade`, but it's also available on its own in case you don't want to upgrade Storybook.

## Prereleases

In addition to the above, Storybook is under constant development, and we publish prerelease versions almost daily. Pre-releases are the best way to try out new features before they are generally available, and we do our best to keep them as stable as possible, although this is not always possible.

To upgrade to the latest prerelease:

```sh
npx sb@next upgrade --prerelease
```

If you'd like to downgrade to a stable version, manually edit the package version numbers in your `package.json` and reinstall.
