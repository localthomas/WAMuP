import { useParams } from "solid-app-router";
import { BackendStore } from "../../backend/backend";
import { AssetDetailed } from "../asset-detailed";
import { PlayBtn, PlusBtn } from "../icon-btns";

export default function Asset(props: {
    backend: BackendStore;
    onPlayNow: (assetID: string) => void;
    onAppendToPlaylist: (assetID: string) => void;
}) {
    const params: any = useParams();
    const id: string = decodeURIComponent(params.id);
    return (
        <div className="container">
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