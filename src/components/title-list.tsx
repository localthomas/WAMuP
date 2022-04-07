import { NavLink } from 'solid-app-router';
import { JSXElement } from 'solid-js';
import { Metadata } from '../backend/metadata';
import { secondsToString } from '../miscellaneous/time-conversion';
import { PlayIcon, PlusIcon } from './icon-btns';

export type MetadataWithID = {
    readonly id: string;
    readonly meta: Metadata;
}

export type TitleListProps = {
    titles: Map<string, Metadata>;
    sortFn?: (a: MetadataWithID, b: MetadataWithID) => number;
    // ignoreList is a list filled with column headings that will be hidden in the output
    ignoreList?: Set<string>;
    currentAsset: string;
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
        { value: meta => meta.meta.track.no === 0 ? "" : "" + meta.meta.track, columnName: "No" },
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

    let list: MetadataWithID[] = [];
    for (const [id, meta] of props.titles) {
        list.push({
            id,
            meta
        });
    }
    let sortFn = props.sortFn;
    if (!sortFn) {
        //default: sort by name
        sortFn = (a: MetadataWithID, b: MetadataWithID): number =>
            a.meta.title.toLowerCase() > b.meta.title.toLowerCase() ? 1 : 0;
    }
    list.sort(sortFn);

    return (
        <table className="table is-striped is-fullwidth is-hoverable">
            <thead>
                <tr>
                    {mapping.map((map) => <th>{map.columnName}</th>)}
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {list.map(asset =>
                    <tr className={props.currentAsset === asset.id ? "is-selected" : ""}>
                        {mapping.map((map) =>
                            <td>
                                {map.value(asset)}
                            </td>)}
                        <td className="action-column has-text-right">
                            <PlayIcon viewBox="0 0 24 24" className="is-primary is-clickable" width="2em" height="2em"
                                onClick={() => {
                                    props.onPlayNow(asset.id);
                                }} />
                            <PlusIcon viewBox="0 0 24 24" className="is-primary is-clickable" width="2em" height="2em"
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
