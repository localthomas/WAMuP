import { Signal } from "solid-js";
import { BackendState } from "../../backend/backend";
import Overview from "../overview";
import SourceDirectoryPicker from "../source-dir-picker";

export default function Default(props: {
    backendSignal: Signal<BackendState>
}) {
    const [backend, setBackend] = props.backendSignal;

    return (
        <>
            <SourceDirectoryPicker backendStateSignal={[backend, setBackend]} />
            <Overview backend={backend}></Overview>
            <h2>Usage</h2>
            <p>TODO tips and tricks for using this software</p>
        </>
    );
}