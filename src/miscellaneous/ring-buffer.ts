/**
 * A RingBuffer is a simple buffer that implements a circular buffer: https://en.wikipedia.org/wiki/Circular_buffer
 */
export class RingBuffer<T> {
    private buffer: T[] = [];
    readonly maxNumberItems;

    /**
     * Create a new empty buffer
     * @param maxNumberItems the storage capacity of the buffer
     */
    constructor(maxNumberItems: number) {
        this.maxNumberItems = maxNumberItems;
    }

    /**
     * Get the current state of the buffer as a list.
     * The length of the list is guaranteed to be equal to or less than `maxNumberItems`.
     * @returns a shallow copy of the underlying buffer
     */
    getList(): T[] {
        // note: return a (shallow) copy of the backing buffer
        return [...this.buffer];
    }

    /**
     * Adds a new element to the list and removing any oldest elements if the buffer reached `maxNumberItems`.
     * @param pushData the data item to add
     */
    push(pushData: T) {
        this.buffer.push(pushData);
        while (this.buffer.length > this.maxNumberItems) {
            this.buffer.shift();
        }
    }
}