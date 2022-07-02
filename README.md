# BBAP

This is a private project and currently in development.
Do not expect any features to work.
There is no guarantee that issues and pull requests will be answered.

This project currently only works on [Chromium based browsers](https://caniuse.com/native-filesystem-api), as it uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API).

## Known Issues

When loading a large file (duration > 1h) in the visualization tab, the browser tab might crash after a while with an out of memory error.

## Development

A nix flake is provided with a simple development environment.
Use `nix develop` (for flake-enabled nix) or `nix-shell` to enter.

Note that currently nothing can be build using the development environment, as building the npm project using nix does not work.
See the `flake.nix` file for more information.

By default, [no type checking is done by parcel](https://parceljs.org/languages/typescript), but `npm run check` can be used as a manual substitute.

Note that parcel performs [code splitting with shared bundles](https://parceljs.org/features/code-splitting/#shared-bundles) by default on production builds.
This creates import errors (modules not found), because this project uses imports in WebWorker scripts and therefore requires that each worker file contains all the necessary code for execution.
To disable shared bundles, the `package.json` configures the `@parcel/bundler-default` with size thresholds for single bundle files that are so big that no sharing should happen in practice.

### Available Scripts

First run `npm install` to download all dependencies of this project.

In the project directory, you can run:

#### `npm run check`

Run the TypeScript compiler and check for any errors.
Can be started in watch mode via `npm run check -- --watch`.

#### `npm run dev`

Runs the app in the development mode.
The page will reload if you make edits.

#### `npm run build`

Builds the app for production to the `dist` folder.
It correctly bundles Solid in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.
The `dist` folder can be deployed to any static host provider.
