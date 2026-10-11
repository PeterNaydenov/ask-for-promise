// Type-level tests for the CommonJS entry. Checked by `tsc --noEmit` (npm run build).
import askForPromise = require ( 'ask-for-promise' )

const single: askForPromise.AskObject = askForPromise ()
single.done ()
const list: askForPromise.AskListObject = askForPromise ([ 'a', 'b' ])
list.each ( ({ value, done }, index ) => done ( `${index}:${value}` ) )
askForPromise.sequence ([ () => 1 ])
askForPromise.all ([ () => 1, Promise.resolve ( 2 ) ])
