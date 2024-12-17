/**
 * Object with promise and related helper functions
 */
interface AskObject {
    promise?: Promise<any>;
    promises?: AskObject[] | null;
    done: (response?: any) => void;
    cancel: (response?: any) => void;
    each: (cbFn: Function, ...args: any[]) => void;
    onComplete: (fx: Function, rejectFx?: Function | null) => void;
    timeout: (ttl: number, expMsg: string | number) => AskObject;
}

export default askForPromise;

declare function askForPromise(list?: Array<any>): AskObject;

declare namespace askForPromise {
    /**
     * Executes list of functions that return a promise in sequence.
     * @param list - List of functions that return a promise
     * @param args - Arguments to be passed to each function in the list
     * @returns Object with promise and related helper functions
     */
    function sequence(list: Array<Function>, ...args: any[]): AskObject;

    /**
     * Executes list of functions that return a promise in parallel.
     * @param list - List of functions that return a promise
     * @param args - Arguments to be passed to each function in the list
     * @returns Object with promise and related helper functions
     */
    function all(list: Array<Function>, ...args: any[]): AskObject;
}