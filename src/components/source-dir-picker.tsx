import { createMemo, Signal } from "solid-js";
import { BackendState, createBackend } from "../backend/backend";

export default function SourceDirectoryPicker(props: {
    backendStateSignal: Signal<BackendState>
}) {
    const [backendState, setBackendState] = props.backendStateSignal;

    const openDirectory = async () => {
        const fileList = await showDirectoryPicker();
        const files = fileListToArray(fileList);
        const rootDirName = findRootDirectoryName(files);

        setBackendState({
            tag: "Loading",
            directory: rootDirName,
            finished: 0,
            total: 0,
        })
        const backend = await createBackend(files, rootDirName, (progress) => {
            setBackendState({
                tag: "Loading",
                directory: rootDirName,
                ...progress
            });
        });
        setBackendState(() => backend);
    };

    const selectedDirectory = createMemo(() => {
        const backend = backendState();
        switch (backend.tag) {
            case "Loading":
                return backend.directory;
            case "Backend":
                return backend.store.directory;
            default:
                return "";
        }
    });

    return (
        <fieldset>
            <legend>Choose source directory</legend>
            <p>
                Select a directory that is analyzed, i.e. all music files are checked for metadata tags like title, artist, and album.
                It is recommended to have these values set for all audio files in the directory, otherwise the files are not displayed correctly.
                Note that no data is uploaded anywhere, this is only required to select a whole folder for analysis in this browser tab.
            </p>
            <label for="selected-directory">Selected directory: </label>
            <input
                id="selected-directory"
                type="text"
                readonly
                placeholder="No directory selected..."
                value={selectedDirectory()} />
            <button disabled={backendState().tag === "Loading"} onClick={openDirectory}>Open Directory</button>
        </fieldset>
    );
}

/**
 * Shows a directory selection dialog to the user via an input with webkitdirectory.
 * Reference: https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/webkitdirectory
 * @returns a FileList or nothing, depending on the user's action
 */
async function showDirectoryPicker(): Promise<FileList | null> {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.addEventListener('change', () => {
            resolve(input.files);
        });
        input.click();
    });
};

/**
 * Converts a `FileList` to a list/array of `File`s.
 * Note that an input of `null` results in an empty list as output.
 * @param list a `FileList` or `null` as input
 * @returns the converted list of `File`s
 */
function fileListToArray(list: FileList | null): File[] {
    let newList = [];
    if (list) {
        for (let i = 0; i < list.length; i++) {
            newList.push(list[i]);
        };
    }
    return newList;
}

/**
 * Uses a list of files and their `webkitRelativePath` attribute for finding a common root directory name.
 * Note that this function might return an empty string, if not all files share the same root directory.
 * @param files a list of files
 * @returns the suspected root directory for all files
 */
function findRootDirectoryName(files: File[]): string {
    /**
     * If the file was stored in a folder, this function returns the root directory name.
     * @param file the file with a `webkitRelativePath`
     * @returns the root directory string
     */
    function rootDir(file: File): string {
        const relativePath = file.webkitRelativePath;
        // find the first occurrence of the character '/'
        const index = relativePath.indexOf("/");
        if (index > 0) {
            return relativePath.substring(0, index);
        }
        return "";
    }

    // return the root dir name, only if it is not different from previous iterations
    let lastRootDirName: undefined | string;
    for (const file of files) {
        const rootDirName = rootDir(file);
        if (lastRootDirName && lastRootDirName !== rootDirName) {
            // if there is only a single mismatch between root directory names, return the fallback
            return "";
        } else {
            // in the first iteration, the last root directory name is unknown
            lastRootDirName = rootDirName;
        }
    }
    return lastRootDirName || "";
}
