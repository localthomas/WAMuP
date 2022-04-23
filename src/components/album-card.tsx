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
        <div class="album-card">
            <div class="image-overlay-container">
                {blobToImageWithDefault(thumbnail())}
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
            <div class="card-content" onClick={() => {
                props.onWantToSeeAlbum();
            }}>
                <h4>{props.album}</h4>
                <p>{props.albumArtist}</p>
            </div>
        </div>
    );
}
