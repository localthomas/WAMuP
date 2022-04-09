import { Component, createResource } from "solid-js";
import { BackendStore } from "../backend/backend";
import { getThumbnail } from "../backend/metadata";
import { blobToImageWithDefault } from "../miscellaneous/images";

export type AssetDetailedProps = {
    backend: BackendStore;
    assetID: string;
}

export const AssetDetailed: Component<AssetDetailedProps> = (props) => {
    const asset = props.backend.get(props.assetID);
    if (!asset) {
        throw "unreachable";
    }
    const metadata = asset.metadata;

    const [thumbnail] = createResource(async () => {
        return await getThumbnail(new Uint8Array(await asset.file.arrayBuffer()), asset.file.type);
    });

    return (
        <div class="container">
            <div class="columns">
                <div class="column is-half">
                    <figure class="image">
                        {blobToImageWithDefault(thumbnail())}
                    </figure>
                </div>
                <div class="column is-half is-centered has-text-centered">
                    <p class="title is-4">{metadata.title}</p>
                    <p class="subtitle is-6">{metadata.artist}</p>
                    <table class="table has-text-justified is-centered mb-3">
                        <tbody>
                            <tr>
                                <td>Album:</td>
                                <td>{metadata.album}</td>
                            </tr>
                            <tr>
                                <td>Album Artist:</td>
                                <td>{metadata.albumArtist}</td>
                            </tr>
                            <tr>
                                <td>Composer:</td>
                                <td>{metadata.composer}</td>
                            </tr>
                            <tr>
                                <td>Genre:</td>
                                <td>{metadata.genre}</td>
                            </tr>
                            <tr>
                                <td>Year:</td>
                                <td>{metadata.year}</td>
                            </tr>
                            <tr>
                                <td>Track:</td>
                                <td>{metadata.track.no}/{metadata.track.of}</td>
                            </tr>
                            <tr>
                                <td>Disc:</td>
                                <td>{metadata.disc.no}/{metadata.disc.of}</td>
                            </tr>
                            <tr>
                                <td>Codec:</td>
                                <td>{metadata.codec}</td>
                            </tr>
                        </tbody>
                    </table>
                    {props.children}
                </div>
            </div>
        </div>
    );
}
