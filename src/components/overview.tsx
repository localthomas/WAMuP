import { Accessor, createMemo } from "solid-js";
import { BackendState } from "../backend/backend";

/**
 * Presents some statistics about a backend in a table.
 * @param props the backend accessor for the overview
 * @returns a div with an overview presented in a table
 */
export default function Overview(props: {
    backend: Accessor<BackendState>
}) {
    const statistics = createMemo(() => {
        const backend = props.backend();
        if (backend.tag === "Backend") {
            return backend.store.getStatistics();
        } else {
            return undefined;
        }
    });

    const table = createMemo(() => {
        const stats = statistics();
        if (stats) {
            return (
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
        } else {
            return <div>Nothing loaded yet...</div>;
        }
    });

    const progress = createMemo(() => {
        const backend = props.backend();
        if (backend.tag === "Loading") {
            return <progress max={backend.total} value={backend.finished}></progress>;
        } else {
            return <></>;
        }
    });

    return (
        <>
            <h2>Statistics</h2>
            {progress()}
            {table()}
        </>
    );
}