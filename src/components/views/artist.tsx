import { useParams } from "solid-app-router";
import { BackendStore } from "../../backend/backend";
import { MetadataWithID } from "../../backend/metadata";
import TitleList, { TitleListEvents } from "../title-list";

export default function Artist(props: {
    backend: BackendStore;
    currentAsset: string | undefined;
} & TitleListEvents) {
    const params = useParams();
    const artist = decodeURIComponent(params.id);

    const assets = processArtist(props.backend, artist);

    return (
        <>
            <h1 class="title">{artist}</h1>
            <TitleList titles={assets} sortFn={undefined}
                ignoreList={new Set(["No", "Artist"])}
                {...props} />
        </>
    );
}

function processArtist(data: BackendStore, artistName: string): MetadataWithID[] {
    return data.asMetadataList().filter(asset => asset.meta.artist === artistName);
}

