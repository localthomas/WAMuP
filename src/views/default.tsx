import { Signal } from "solid-js";
import { BackendState } from "../backend/backend";
import Overview from "../components/overview";
import SourceDirectoryPicker from "../components/source-dir-picker";

export default function Default(props: {
    backendSignal: Signal<BackendState>
}) {
    const [backend, setBackend] = props.backendSignal;

    return (
        <>
            <h1>BBAP</h1>
            <Overview backend={backend}></Overview>
            <h2>Usage</h2>
            <p>
                This software is a single page application, meaning it does not trigger any traffic after the site initially was downloaded.
                It is also available for registering as an offline progressive web app, again without any online access.
            </p>
            <p>
                Generally everything that is either <span class="TODO">underlined</span> or <span class="TODO">colored in the accent color</span> is an interactive object.
                The state of the application is only stored in this browser tab, so other tabs do not have the same audio player or used the same folder for analysis.
                Note that reloading the current page clears the curren tab, so all state, including the playlist, is lost.
            </p>
            <SourceDirectoryPicker backendStateSignal={[backend, setBackend]} />
        </>
    );
}