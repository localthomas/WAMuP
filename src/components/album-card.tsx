import { Link, useNavigate } from "solid-app-router";
import { Accessor } from "solid-js";
import { blobToImageSrcWithDefault } from "../miscellaneous/images";
import { InfoBtn, PlayBtn } from "./icon-btns";

export default function AlbumCard(props: {
    album: string;
    thumbnailData: Accessor<Blob | undefined>;
    albumArtist: string;
    onWantToPlay: () => void;
}) {
    const navigate = useNavigate();

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
                            navigate("/albums/" + encodeURIComponent(props.album));
                        }} />
                </div>
            </div>
            <div class="card-content">
                <h4>
                    <Link href={"/albums/" + encodeURIComponent(props.album)}>
                        {props.album}
                    </Link>
                </h4>
                <p>
                    <Link href={"/artists/" + encodeURIComponent(props.albumArtist)}>
                        {props.albumArtist}
                    </Link>
                </p>
            </div>
        </div>
    );
}
