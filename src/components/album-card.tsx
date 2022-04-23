import { Accessor } from "solid-js";
import { blobToImageSrcWithDefault } from "../miscellaneous/images";
import { InfoBtn, PlayBtn } from "./icon-btns";

export default function AlbumCard(props: {
    album: string;
    thumbnailData: Accessor<Blob | undefined>;
    albumArtist: string;
    onWantToPlay: () => void;
    onWantToSeeAlbum: () => void;
}) {
    return (
        <div class="album-card">
            <div class="image-overlay-container">
                <img src={blobToImageSrcWithDefault(props.thumbnailData())} loading="lazy" />
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
