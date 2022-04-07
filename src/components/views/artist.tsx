import { useParams } from "solid-app-router";
import { Asset, BackendStore } from "../../backend/backend";
import { Metadata } from "../../backend/metadata";
import TitleList, { TitleListEvents } from "../title-list";

export default function Artist(props: {
    backend: BackendStore;
    currentAsset: string;
} & TitleListEvents) {
    const params = useParams();
    const artist = decodeURIComponent(params.id);

    console.log("TEST", artist);

    const assets = processArtist(props.backend, artist);

    return (
        <>
            <h1 className="title">{artist}</h1>
            <TitleList titles={assets} sortFn={undefined}
                ignoreList={new Set(["No", "Artist"])}
                {...props} />
        </>
    );
}

function processArtist(data: BackendStore, artistName: string): Map<string, Metadata> {
    let map = new Map<string, Metadata>();
    data.forEach((assetID: string, asset: Asset) => {
        //filter for given artist name
        if (asset.metadata.artist === artistName) {
            map.set(assetID, asset.metadata);
        }
    });
    return map;
}

