---
title: 'CLI options'
---

Storybook comes with two CLI utilities: `start-storybook` and `build-storybook`.

Pass these commands the following options to alter Storybook's behavior.

## start-storybook

```plaintext
Usage: start-storybook [options]
```

| Options                         | Description                                                                                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--help`                        | Output usage information <br/>`start-storybook --help`                                                                                                                      |
| `-V`, `--version`               | Output the version number <br/>`start-storybook -V`                                                                                                                         |
| `-p`, `--port [number]`         | Port to run Storybook <br/>`start-storybook -p 9009`                                                                                                                        |
| `-h`, `--host [string]`         | Host to run Storybook <br/>`start-storybook -h my-host.com`                                                                                                                 |
| `-s`, `--static-dir`            | **Deprecated** [see note](#static-dir-deprecation). Directory where to load static files from, comma-separated list <br/>`start-storybook -s public`                        |
| `-c`, `--config-dir [dir-name]` | Directory where to load Storybook configurations from <br/>`start-storybook -c .storybook`                                                                                  |
| `--https`                       | Serve Storybook over HTTPS. Note: You must provide your own certificate information. <br/>`start-storybook --https`                                                         |
| `--ssl-ca`                      | Provide an SSL certificate authority. (Optional with --https, required if using a self-signed certificate) <br/>`start-storybook --ssl-ca my-certificate`                   |
| `--ssl-cert`                    | Provide an SSL certificate. (Required with --https)<br/>`start-storybook --ssl-cert my-ssl-certificate`                                                                     |
| `--ssl-key`                     | Provide an SSL key. (Required with --https)<br/>`start-storybook --ssl-key my-ssl-key`                                                                                      |
| `--smoke-test`                  | Exit after successful start<br/>`start-storybook --smoke-test`                                                                                                              |
| `--ci`                          | CI mode (skip interactive prompts, don't open browser)<br/>`start-storybook --ci`                                                                                           |
| `--no-open`                     | Do not open Storybook automatically in the browser<br/>`start-storybook --no-open`                                                                                          |
| `--quiet`                       | Suppress verbose build output<br/>`start-storybook --quiet`                                                                                                                 |
| `--no-dll`                      | Do not use dll reference (no-op)<br/>`start-storybook --no-dll`                                                                                                             |
| `--debug-webpack`               | Display final webpack configurations for debugging purposes<br/>`start-storybook --debug-webpack`                                                                           |
| `--webpack-stats-json`          | Write Webpack Stats JSON to disk<br/>`start-storybook --webpack-stats-json /tmp/webpack-stats`                                                                              |
| `--docs`                        | Starts Storybook in documentation mode. Learn more about it in [here](../writing-docs/build-documentation.md#preview-storybooks-documentation)<br/>`start-storybook --docs` |
| `--no-manager-cache`            | Disables Storybook's manager caching mechanism. See note below.<br/>`start-storybook --no-manager-cache`                                                                    |

<div class="aside">
💡 <strong>NOTE</strong>: The flag <code>--no-manager-cache</code> disables the internal caching of Storybook and can severely impact your Storybook loading time, so only use it when you need to refresh Storybook's UI, such as when editing themes.
</div>

<div class="aside" id="static-dir-deprecation">

💡 <strong>NOTE</strong>: Starting in 6.4 the `-s` flag is deprecated. Instead, use a configuration object in your `.storybook/main.js` file. See the [images and assets documentation](../configure/images-and-assets.md#serving-static-files-via-storybook) for more information.

</div>

## build-storybook

```plaintext
Usage: build-storybook [options]
```

| Options                         | Description                                                                                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-h`, `--help`                  | Output usage information<br/>`build-storybook --help`                                                                                                                       |
| `-V`, `--version`               | Output the version number<br/>`build-storybook -V`                                                                                                                          |
| `-s`, `--static-dir`            | **Deprecated** [see note](#static-dir-deprecation). Directory where to load static files from, comma-separated list<br/>`build-storybook -s public`                         |
| `-o`, `--output-dir [dir-name]` | Directory where to store built files<br/>`build-storybook -o /my-deployed-storybook`                                                                                        |
| `-c`, `--config-dir [dir-name]` | Directory where to load Storybook configurations from<br/>`build-storybook -c .storybook`                                                                                   |
| `--loglevel [level]`            | Controls level of logging during build. Can be one of: [silly, verbose, info (default), warn, error, silent]<br/>`build-storybook --loglevel warn`                          |
| `--quiet`                       | Suppress verbose build output<br/>`build-storybook --quiet`                                                                                                                 |
| `--no-dll`                      | Do not use dll reference (no-op)<br/>`build-storybook --no-dll`                                                                                                             |
| `--debug-webpack`               | Display final webpack configurations for debugging purposes<br/>`build-storybook --debug-webpack`                                                                           |
| `--webpack-stats-json`          | Write Webpack Stats JSON to disk<br/>`build-storybook --webpack-stats-json /my-storybook/webpack-stats`                                                                     |
| `--docs`                        | Builds Storybook in documentation mode. Learn more about it in [here](../writing-docs/build-documentation.md#publish-storybooks-documentation)<br/>`build-storybook --docs` |

<div class="aside">
💡 <strong>NOTE</strong>: If you're using npm instead of yarn to publish Storybook, the commands work slightly different. For example, <code>npm run build-storybook -- -o ./path/to/build</code>.
</div>