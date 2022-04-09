import { createResource } from "solid-js";
import { Asset } from "../backend/backend";
import { blobToImageWithDefault } from "../miscellaneous/images";
import { InfoBtn, PlayBtn } from "./icon-btns";
import { getFirstThumbnail } from "../views/album";

export default function AlbumCard(props: {
    album: string;
    assets: Asset[];
    albumArtist: string;
    onWantToPlay: () => void;
    onWantToSeeAlbum: () => void;
}) {
    const [thumbnail] = createResource(async () => {
        return await getFirstThumbnail(props.assets);
    });
    return (
        <div class="card">
            <div class="card-image">
                <div class="image image-overlay-container">
                    <figure class="image-overlay-image">
                        {blobToImageWithDefault(thumbnail())}
                    </figure>
                    <div class="image-overlay">
                        <PlayBtn outlined
                            onClick={() => {
                                props.onWantToPlay();
                            }} />
                        <InfoBtn outlined
                            onClick={() => {
                                props.onWantToSeeAlbum();
                            }} />
                    </div>
                </div>
            </div>
            <div class="card-content is-clickable" onClick={() => {
                props.onWantToSeeAlbum();
            }}>
                <div class="media">
                    <div class="media-content">
                        <p class="title is-6">{props.album}</p>
                        <p class="subtitle is-6">{props.albumArtist}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
