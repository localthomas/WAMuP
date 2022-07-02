import { createMemo, Signal } from "solid-js";
import { BackendState, createBackend } from "../backend/backend";

export default function SourceDirectoryPicker(props: {
    backendStateSignal: Signal<BackendState>
}) {
    const [backendState, setBackendState] = props.backendStateSignal;

    const openDirectory = async () => {
        const handle = await window.showDirectoryPicker();
        setBackendState({
            tag: "Loading",
            directory: handle.name,
            finished: 0,
            total: 0,
        })
        const backend = await createBackend(handle, (progress) => {
            setBackendState({
                tag: "Loading",
                directory: handle.name,
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