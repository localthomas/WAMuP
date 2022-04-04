import { createSignal, Signal } from "solid-js";
import { BackendState, createBackend } from "../backend/backend";

export default function SourceDirectoryPicker(props: {
    backendStateSignal: Signal<BackendState>
}) {
    const [backendState, setBackendState] = props.backendStateSignal;
    const [directoryName, setDirectoryName] = createSignal("");

    const openDirectory = async () => {
        const handle = await window.showDirectoryPicker();
        setDirectoryName(handle.name);
        const backend = await createBackend(handle, (progress) => {
            setBackendState({
                tag: "Loading",
                ...progress
            });
        });
        setBackendState(() => backend);
    };

    return (
        <fieldset>
            <legend>Choose source directory</legend>

            <label for="selected-directory">Selected directory: </label>
            <input id="selected-directory" type="text" readonly placeholder="No directory selected..." value={directoryName()} />
            <button disabled={backendState().tag === "Loading"} onClick={openDirectory}>Open Directory</button>
        </fieldset>
    );
}