/**
 * Compares two objects recursively for equality.
 * Note that this implementation only handles JS objects with primitive types or objects as values.
 * @param a first object
 * @param b second object
 */
export function simpleDeepEquals(a: any, b: any): boolean {
    if (a === b) {
        return true;
    }
    if (isPrimitive(a) && isPrimitive(b)) {
        return a === b;
    }
    for (const property in a) {
        if (Object.hasOwn(b, property)) {
            if (!simpleDeepEquals(a[property], b[property])) {
                return false;
            }
        } else {
            return false;
        }
    }
    return true;
}

/**
 * Checks if the given object is a primitive type, i.e. a primitive is anything that is **not** an object.
 * See the [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/Object) constructor for more details.
 * @param obj the object to check
 * @returns true, if it is any primitive JavaScript type
 */
function isPrimitive(obj: any): boolean {
    return (obj !== Object(obj));
}
