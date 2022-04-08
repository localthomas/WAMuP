export type QueueState = {
    readonly playlist: string[];
};

export function getCurrentAssetOfQueue(state: QueueState): string | undefined {
    return state.playlist.at(0);
}

export function appendToQueue(state: QueueState, assetID: string): QueueState {
    return {
        ...state,
        playlist: state.playlist.concat(assetID),
    };
}

export function pushFrontToQueue(state: QueueState, assetID: string): QueueState {
    return {
        ...state,
        playlist: [assetID].concat(state.playlist),
    };
}

export function removeFromQueue(state: QueueState, index: number): QueueState {
    const playlist = state.playlist;
    return {
        ...state,
        playlist: playlist.slice(0, index).concat(playlist.slice(index + 1, playlist.length)),
    };
}

export function setQueue(state: QueueState, newList: string[]): QueueState {
    if (newList) {
        return {
            ...state,
            playlist: newList,
        };
    } else {
        console.warn("the given new list was not legal:", newList)
        return { ...state };
    }
}
