import { defineConfig } from 'vite';


// Vite builds with Rolldown. The module resolution is built in, so no
// extra plugin is needed. The package has no runtime dependencies and
// 'src/askForPromise.js' imports nothing.
//
// The build target is ES2015 syntax. Runtime APIs such as Promise and timers
// must be supplied by the host.
//
// There is no ES module bundle. The ES module consumers are served the
// raw 'src/askForPromise.js' through the 'exports' field of package.json.

export default defineConfig ({
      build: {
            lib: {
                  entry    : 'src/askForPromise.js'
                , name     : 'askForPromise'
                , formats  : [ 'cjs', 'umd' ]
                , fileName : format => format === 'cjs' ? 'ask-for-promise.cjs'
                                : 'ask-for-promise.umd.js'
            }
        , target   : 'es2015'
        , minify  : true
      }
})
