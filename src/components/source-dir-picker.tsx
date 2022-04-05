import { createEffect, createSignal, Signal } from "solid-js";
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

    const [selectedDirectory, setSelectedDirectory] = createSignal("");
    createEffect(() => {
        const backend = backendState();
        switch (backend.tag) {
            case "Loading":
                setSelectedDirectory(backend.directory);
                break;
            case "Backend":
                setSelectedDirectory(backend.store.directory);
                break;
            default:
                setSelectedDirectory("");
        }
    });

    return (
        <fieldset>
            <legend>Choose source directory</legend>

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