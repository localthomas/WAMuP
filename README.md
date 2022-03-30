# BBAP

This is a private project and currently in heavy development.
Do not expect any features to work.

This project currently only works on [Chromium based browsers](https://caniuse.com/native-filesystem-api), as it uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API).

## Development

A nix flake is provided with a simple development environment.
Use `nix develop` (for flake-enabled nix) or `nix-shell` to enter.

Note that currently nothing can be build using the development environment, as building the npm project using nix does not work.
See the `flake.nix` file for more information.

By default, [no type checking is done by parcel](https://parceljs.org/languages/typescript), but `npm run check` can be used as a manual substitute.

### Available Scripts

In the project directory, you can run:

#### `npm run dev`

Runs the app in the development mode.
The page will reload if you make edits.

#### `npm run build`

Builds the app for production to the `dist` folder.
It correctly bundles Solid in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.
The `dist` folder can be deployed to any static host provider.
