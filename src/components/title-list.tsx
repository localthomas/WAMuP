import { Link } from '@solidjs/router';
import { JSXElement } from 'solid-js';
import { MetadataWithID } from '../backend/metadata';
import { secondsToString } from '../miscellaneous/time-conversion';
import { PlayBtn, PlusBtn } from './icon-btns';

export type TitleListProps = {
    titles: MetadataWithID[];
    sortFn?: (a: MetadataWithID, b: MetadataWithID) => number;
    // ignoreList is a list filled with column headings that will be hidden in the output
    ignoreList?: Set<string>;
    currentAsset: string | undefined;
} & TitleListEvents

export type TitleListEvents = {
    onPlayNow: (assetID: string) => void;
    onAppendToPlaylist: (assetID: string) => void;
}

export default function TitleList(props: TitleListProps) {
    //mapping maps the field name to a displayed name per column
    type Mapping = {
        value: (meta: MetadataWithID) => JSXElement;
        columnName: string;
        /** fixed width columns are expected to have short content */
        fixedWidth: boolean;
    }
    let mapping: Mapping[] = [
        {
            value: meta => meta.meta.track.no === 0 ? "" : "" + meta.meta.track.no,
            columnName: "No",
            fixedWidth: true,
        },
        {
            value: (asset) => <Link href={"/assets/" + encodeURIComponent(asset.id)}>{asset.meta.title}</Link>,
            columnName: "Title",
            fixedWidth: false,
        },
        {
            value: (asset) => <Link href={"/artists/" + encodeURIComponent(asset.meta.artist)}>{asset.meta.artist}</Link>,
            columnName: "Artist",
            fixedWidth: false,
        },
        {
            value: (asset) => <Link href={"/albums/" + encodeURIComponent(asset.meta.album)}>{asset.meta.album}</Link>,
            columnName: "Album",
            fixedWidth: false,
        },
        {
            value: (asset) => secondsToString(asset.meta.durationSeconds ?? 0),
            columnName: "Length",
            fixedWidth: true,
        },
    ];
    //remove the items from mapping that should be ignored
    if (props.ignoreList) {
        props.ignoreList.forEach(columnName => {
            mapping = mapping.filter(map => map.columnName !== columnName);
        })
    }

    const list = props.titles;
    let sortFn = props.sortFn;
    if (!sortFn) {
        //default: sort by name
        sortFn = (a: MetadataWithID, b: MetadataWithID): number =>
            a.meta.title.toLowerCase() > b.meta.title.toLowerCase() ? 1 : 0;
    }
    list.sort(sortFn);

    return (
        <table class="is-striped">
            <thead>
                <tr>
                    {mapping.map((map) => <th>{map.columnName}</th>)}
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {list.map(asset =>
                    <tr class={props.currentAsset === asset.id ? "active-row" : ""}>
                        {mapping.map((map) =>
                            <td class={map.fixedWidth ? "fixed-width" : ""}>
                                {map.value(asset)}
                            </td>)}
                        <td class="fixed-width">
                            <PlayBtn
                                small
                                onClick={() => {
                                    props.onPlayNow(asset.id);
                                }} />
                            <PlusBtn
                                small
                                onClick={() => {
                                    props.onAppendToPlaylist(asset.id);
                                }} />
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
}
