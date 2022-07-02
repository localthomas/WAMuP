/**
 * This is a very simple unbound cache that stores the result of an arbitrary computation.
 * `K` is the key for the store and `V` the result of a computation.
 */
export class SimpleCache<K, V> {
    private store: Map<K, V>;

    constructor() {
        this.store = new Map();
    }

    /**
     * Either returns the result from the cache or executes the processing function to populate the cache with a result value.
     * @param key the key to which uniquely identify the result of the processing
     * @param processingFunction the function that can generate a result
     * @returns the result either from the cache or the processing function
     */
    public async processOrGet(key: K, processingFunction: () => Promise<V>): Promise<V> {
        // check if there is a value for the corresponding key
        const value = this.store.get(key);
        if (value) {
            // either return the cached value
            return value;
        } else {
            // or generate a new value
            const newValue = await processingFunction();
            this.store.set(key, newValue);
            return newValue;
        }
    }
}
