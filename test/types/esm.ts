// Type-level tests for the ESM entry. Checked by `tsc --noEmit` (npm run build).
import askForPromise, { type AskObject, type AskListObject, type EachContext } from 'ask-for-promise'

const single: AskObject = askForPromise ()
single.done ( 1 )
single.cancel ( new Error ( 'x' ) )
single.onComplete ( r => r, e => e )
single.each ( ( { value, done }: EachContext, index ) => {
                                const i: number | undefined = index
                                done ( value )
                            }, 'extra' )
const chained: AskObject = single.timeout ( 100, 'late' )

const list: AskListObject = askForPromise ([ 1, 2, 3 ])
list.promises[0].done ( 1 )
list.each ( ({ value, done, timeout }, index, extra ) => {
                                const i: number = index
                                timeout ( 50, 'late' )
                                done ( value )
                            }, 'extra' )
const listChained: AskListObject = list.timeout ( 100, 'late' )
const all: Promise<any[]> = list.promise
const general: AskObject = list

askForPromise.sequence ([ ( a: number ) => Promise.resolve ( a ), ( a: number, prev: number ) => prev + 1 ], 5 )
askForPromise.all ([ Promise.resolve ( 1 ), () => 2, ( a: string ) => a ], 'arg' )

// @ts-expect-error — `timeout` needs a ttl
single.timeout ()
// @ts-expect-error — `sequence` needs a list of functions
askForPromise.sequence ([ 1 ])
// @ts-expect-error — `promises` is nullable in single mode
single.promises[0]
