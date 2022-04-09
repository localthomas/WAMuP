import { NavLink } from 'solid-app-router';
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
    }
    let mapping: Mapping[] = [
        { value: meta => meta.meta.track.no === 0 ? "" : "" + meta.meta.track.no, columnName: "No" },
        {
            value: (asset) => <NavLink href={"/assets/" + encodeURIComponent(asset.id)}>{asset.meta.title}</NavLink>,
            columnName: "Title"
        },
        {
            value: (asset) => <NavLink href={"/artists/" + encodeURIComponent(asset.meta.artist)}>{asset.meta.artist}</NavLink>,
            columnName: "Artist"
        },
        {
            value: (asset) => <NavLink href={"/albums/" + encodeURIComponent(asset.meta.album)}>{asset.meta.album}</NavLink>,
            columnName: "Album"
        },
        {
            value: (asset) => secondsToString(asset.meta.durationSeconds ?? 0),
            columnName: "Length"
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
        <table class="table is-striped is-fullwidth is-hoverable">
            <thead>
                <tr>
                    {mapping.map((map) => <th>{map.columnName}</th>)}
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {list.map(asset =>
                    <tr class={props.currentAsset === asset.id ? "is-selected" : ""}>
                        {mapping.map((map) =>
                            <td>
                                {map.value(asset)}
                            </td>)}
                        <td class="action-column has-text-right">
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
