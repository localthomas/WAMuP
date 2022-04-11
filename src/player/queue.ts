/**
 * A queue that allows to listen to changes made to it.
 */
export class ObservableQueue<T> {
    private list: ObservableList<T>;

    constructor(onChange: (list: T[]) => void) {
        this.list = new ObservableList(onChange);
    }

    /**
     * Returns the item located at the current working position, i.e. at the head of the queue.
     */
    atFront(): T | undefined {
        return this.list.at(0);
    }

    /**
     * Get the number of items in the queue.
     * @returns the number of items in the queue
     */
    size(): number {
        return this.list.length();
    }

    /**
     * Add an item to the end of the queue (i.e. push to back).
     * @param item the item to add
     */
    appendToQueue(item: T) {
        this.list.makeChange(
            (list) => list.concat(item)
        );
    }

    /**
     * Adds an item directly at the front of the queue, pushing the current value at the front back by one.
     * @param item the item to add
     */
    pushFrontToQueue(item: T) {
        this.list.makeChange(
            (list) => [item].concat(list)
        );
    }

    /**
     * Remove a specific item from the queue.
     * @param index the index at which the item for removal should be removed
     */
    removeFromQueue(index: number) {
        this.list.makeChange(
            (list) => list.slice(0, index).concat(list.slice(index + 1, list.length))
        );
    }

    /**
     * Sets a new queue list, where the first index is the front of the queue.
     * @param newList the new list to set as queue
     */
    setQueue(newList: T[]) {
        this.list.makeChange((_list) => newList);
    }
}

/**
 * A list that only allows changes through a proxy function (`makeChange`) and allows to react to changes.
 */
class ObservableList<T> {
    private list: T[];
    private onChangeCallback: (list: T[]) => void;

    constructor(onChange: (list: T[]) => void) {
        this.list = [];
        this.onChangeCallback = onChange;
    }

    /**
     * Applies a change to the underlying list and calls the callback.
     * @param changeFunction the change that should be applied
     */
    makeChange(changeFunction: (list: T[]) => T[]) {
        const newList = changeFunction(this.list);
        this.list = newList;
        this.onChangeCallback(this.list);
    }

    /**
     * Returns the item located at the specified index.
     * @param index — The zero-based index of the desired code unit. A negative index will count back from the last item.
     */
    at(index: number): T | undefined {
        return this.list.at(index);
    }

    /**
     * Get the number of elements in the list.
     * @returns the number of elements in the list
     */
    length(): number {
        return this.list.length;
    }
}
