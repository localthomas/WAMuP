import { Parcel } from "@parcel/core";
import { fileURLToPath } from "url";
import { readFile } from "fs/promises";

import { exec } from "node:child_process";

const packageJson = JSON.parse(
    await readFile(
        new URL("./package.json", import.meta.url)
    )
);

let bundler = new Parcel({
    entries: packageJson.source,
    defaultConfig: "@parcel/config-default",
    serveOptions: {
        port: 1234
    },
    hmrOptions: {
        port: 1234
    },
    additionalReporters: [
        {
            packageName: "@parcel/reporter-cli",
            resolveFrom: fileURLToPath(import.meta.url)
        }
    ],
});

await bundler.watch((_err, buildEvent) => {
    if (buildEvent.type === "buildSuccess") {
        exec("npm run postbuild", (error, stdout, _stderr) => {
            if (error) {
                throw `Error on npm run postbuild: ${error.message}`;
            }
            console.log(stdout);
        });
    }
});
