import { children, createMemo, createResource, ParentComponent } from "solid-js";
import { BackendStore } from "../backend/backend";
import { blobToImageSrcWithDefault } from "../miscellaneous/images";

export type AssetDetailedProps = {
    backend: BackendStore;
    assetID: string;
}

export const AssetDetailed: ParentComponent<AssetDetailedProps> = (props) => {
    const resolvedChildren = children(() => props.children);

    const assetID = createMemo(() => props.assetID);

    const metadata = createMemo(() => {
        const asset = props.backend.get(assetID());
        if (!asset) {
            throw "unreachable";
        }
        return asset.metadata;
    });

    const [thumbnail] = createResource(assetID, async (assetID) => {
        return await props.backend.getThumbnail(assetID);
    });

    return (
        <div class="asset-detailed">
            <div class="column">
                <img src={blobToImageSrcWithDefault(thumbnail())} loading="lazy" />
            </div>
            <div class="column details">
                <h1>{metadata().title}</h1>
                <h2>{metadata().artist}</h2>
                <table>
                    <tbody>
                        <tr>
                            <td>Album:</td>
                            <td>{metadata().album}</td>
                        </tr>
                        <tr>
                            <td>Album Artist:</td>
                            <td>{metadata().albumArtist}</td>
                        </tr>
                        <tr>
                            <td>Composer:</td>
                            <td>{metadata().composer}</td>
                        </tr>
                        <tr>
                            <td>Genre:</td>
                            <td>{metadata().genre}</td>
                        </tr>
                        <tr>
                            <td>Year:</td>
                            <td>{metadata().year}</td>
                        </tr>
                        <tr>
                            <td>Track:</td>
                            <td>{metadata().track.no}/{metadata().track.of}</td>
                        </tr>
                        <tr>
                            <td>Disc:</td>
                            <td>{metadata().disc.no}/{metadata().disc.of}</td>
                        </tr>
                        <tr>
                            <td>Codec:</td>
                            <td>{metadata().codec}</td>
                        </tr>
                    </tbody>
                </table>
                {resolvedChildren()}
            </div>
        </div>
    );
}
