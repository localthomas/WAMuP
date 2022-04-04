import { Accessor, createEffect, createSignal } from "solid-js";
import { Backend, BackendState, Statistics } from "../backend/backend";

/**
 * Presents some statistics about a backend in a table.
 * @param props the backend accessor for the overview
 * @returns a div with an overview presented in a table
 */
export default function Overview(props: {
    backend: Accessor<BackendState>
}) {
    const [statistics, setStatistics] = createSignal<Statistics | undefined>(undefined);
    createEffect(() => {
        const backend = props.backend();
        if (backend.tag === "Backend") {
            setStatistics(backend.store.getStatistics());
        }
    });

    const [table, setTable] = createSignal(<div>Nothing loaded yet...</div>);
    createEffect(() => {
        const stats = statistics();
        if (stats) {
            setTable(
                <table>
                    <tbody>
                        <tr>
                            <td>Number of artists:</td>
                            <td>{stats.numArtists}</td>
                        </tr>
                        <tr>
                            <td>Number of albums:</td>
                            <td>{stats.numAlbums}</td>
                        </tr>
                        <tr>
                            <td>Number of assets:</td>
                            <td>{stats.numAssets}</td>
                        </tr>
                        <tr>
                            <td>Oldest:</td>
                            <td>{stats.oldestYear}</td>
                        </tr>
                        <tr>
                            <td>Newest:</td>
                            <td>{stats.newestYear}</td>
                        </tr>
                    </tbody>
                </table>
            );
        }
    })

    const [progress, setProgress] = createSignal(<></>);
    createEffect(() => {
        const backend = props.backend();
        if (backend.tag === "Loading") {
            setProgress(<progress max={backend.total} value={backend.finished}></progress>);
        } else {
            setProgress(<></>);
        }
    });

    return (
        <div>
            <h1>BBAP</h1>
            <h2>Statistics</h2>
            {progress()}
            {table()}
        </div>
    );
}