# SPDX-FileCopyrightText: 2022 localthomas
#
# SPDX-License-Identifier: MIT OR Apache-2.0
{
  description = "This is a music player realized as web app";

  inputs = {
    # for eachSystem function
    flake-utils.url = "github:numtide/flake-utils";
    # use flake-compat as side-effect for flake.lock file that is read by shell.nix
    # fill the flake.lock file with `nix flake lock --update-input flake-compat`
    flake-compat = {
      url = "github:edolstra/flake-compat";
      flake = false;
    };

    npmlock2nix = {
      url = "github:nix-community/npmlock2nix";
      flake = false;
    };
  };

  outputs = { self, nixpkgs, flake-utils, npmlock2nix, ... }:
    flake-utils.lib.eachSystem [ "x86_64-linux" ] (system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };

        nodejs = pkgs.nodejs;

        # npmlock2nix-eval can be used as https://github.com/nix-community/npmlock2nix/blob/master/API.md
        npmlock2nix-eval = pkgs.callPackage npmlock2nix { };
      in
      {
        devShell = pkgs.mkShell {
          nativeBuildInputs = [ pkgs.nixpkgs-fmt nodejs ];
        };

        # dev shell containing the node_modules data
        # this does not work currently due to a bug in npmlock2nix or npm:
        # https://github.com/nix-community/npmlock2nix/issues/45
        #devShell = npmlock2nix-eval.shell
        #  {
        #    src = ./.;
        #    # use copy, as vite needs to create a folder "node_modules/.vite"
        #    node_modules_mode = "copy";
        #    inherit nodejs;
        #  };
      }
    );
}
