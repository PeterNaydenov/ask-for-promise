export default askForPromise;
export type askObject = {};
/**
 * @typedef askObject
 * @type {Object}
 * @description Object with promise and related helper functions
 * @property {Promise} [promise] - Promise object if a single promise is created
 * @property {Array<Promise>} [promises] - Array of promises if multiple promises are created
 * @property {Function} done - Resolve function
 * @property {Function} cancel - Reject function
 * @property {Function} onComplete - Function to be called after promise is resolved
 * @property {Function} timeout - Function to set timeout on promise
 *
 */
/**
 * @function askForPromise
 * @param {Array<any>} [list] - List of items that need to have a corresponding promise.(optional)
 * @returns {askObject} - Object with promise and related helper functions
 */
declare function askForPromise(list?: Array<any>): askObject;
declare namespace askForPromise {
    /**
     * @function sequence
     * @description Executes list of functions that return a promise in sequence.
     * @param {Array<Function>} list - List of functions that return a promise
     * @param {...any} args - Arguments to be passed to each function in the list
     * @returns {askObject} - Object with promise and related helper functions
     */
    function sequence(list: Array<Function>, ...args: any[]): askObject;
    /**
     * @function all
     * @description Executes list of functions that return a promise in parallel.
     * @param {Array<Function>} list - List of functions that return a promise
     * @param {...any} args - Arguments to be passed to each function in the list
     * @returns {askObject} - Object with promise and related helper functions
     */
    function all(list: Array<Function>, ...args: any[]): askObject;
}
//# sourceMappingURL=askForPromise.d.ts.map