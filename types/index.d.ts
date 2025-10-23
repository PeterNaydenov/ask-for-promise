export interface AskObject {
    promise: Promise<any>;
    promises?: AskObject[] | null;
    done: (response?: any) => void;
    cancel: (response?: any) => void;
    each: (cbFn: (...args: any[]) => void, ...args: any[]) => void;
    onComplete: (fx: (result: any) => void, rejectFx?: ((error: any) => void) | null) => void;
    timeout: (ttl: number, expMsg: any) => AskObject;
}

export default askForPromise;

declare function askForPromise(list?: any[]): AskObject;

declare namespace askForPromise {
    function sequence(list: (() => Promise<any>)[], ...args: any[]): AskObject;
    function all(list: (() => Promise<any>)[], ...args: any[]): AskObject;
}