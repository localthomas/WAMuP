import { useParams } from "@solidjs/router";
import { BackendStore } from "../backend/backend";
import { AssetDetailed } from "../components/asset-detailed";
import { PlayBtn, PlusBtn } from "../components/icon-btns";

export default function Asset(props: {
    backend: BackendStore;
    onPlayNow: (assetID: string) => void;
    onAppendToPlaylist: (assetID: string) => void;
}) {
    const params: any = useParams();
    const id: string = decodeURIComponent(params.id);
    return (
        <div class="container">
            <AssetDetailed backend={props.backend} assetID={id}>
                <PlayBtn outlined
                    onClick={() => {
                        props.onPlayNow(id);
                    }} />
                <PlusBtn outlined
                    onClick={() => {
                        props.onAppendToPlaylist(id);
                    }} />
            </AssetDetailed>
        </div>
    );
}