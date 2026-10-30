'use strict'

import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { expect } from 'chai'

const root = fileURLToPath ( new URL ( '../', import.meta.url ) )
const require = createRequire ( import.meta.url )
const tsc = join ( dirname ( require.resolve ( 'typescript/package.json' ) ), 'bin/tsc' )
// npm exposes its JavaScript entry point to scripts. Running it with Node
// also works on Windows, where execFileSync cannot execute npm.cmd directly.
const npmCli = process.env.npm_execpath
const npm = ( args, options ) => npmCli
    ? execFileSync ( process.execPath, [ npmCli, ...args ], options )
    : execFileSync ( 'npm', args, options )

describe ( 'packed package', function () {
    this.timeout ( 30000 )

    it ( 'ships documentation and resolves types for external ESM and CommonJS consumers', () => {
        const dir = mkdtempSync ( join ( tmpdir(), 'ask-for-promise-package-' ) )
        try {
            const cache = join ( dir, 'cache' )
            const pack = JSON.parse ( npm ( [ 'pack', '--ignore-scripts', '--json', '--pack-destination', dir, '--cache', cache ], { cwd: root, encoding: 'utf8' } ) )
            const info = Array.isArray ( pack ) ? pack[0] : pack['ask-for-promise']
            const paths = info.files.map ( file => file.path )
            expect ( paths ).to.include.members ([ 'types/index.d.ts', 'types/index.d.cts', 'README.md', 'Changelog.md', 'Ask-for-promise.png' ])
            const consumer = join ( dir, 'consumer' )
            mkdirSync ( consumer )
            writeFileSync ( join ( consumer, 'package.json' ), '{"private":true}' )
            npm ( [ 'install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--cache', cache, join ( dir, info.filename ) ], { cwd: consumer, stdio: 'pipe' } )
            for ( const [ mode, code ] of [
                [ 'module', "import ask from 'ask-for-promise'; const task = ask(); task.done('ready'); if (await task.promise !== 'ready') throw new Error('ESM entry failed')" ],
                [ 'commonjs', "const ask = require('ask-for-promise'); const task = ask(); task.done('ready'); task.promise.then(value => { if (value !== 'ready') throw new Error('CommonJS entry failed') })" ]
            ] ) {
                execFileSync ( process.execPath, [ '--unhandled-rejections=strict', '--input-type=' + mode, '-e', code ], { cwd: consumer, stdio: 'pipe' } )
            }
            copyFileSync ( join ( root, 'test/types/esm.ts' ), join ( consumer, 'consumer.mts' ) )
            copyFileSync ( join ( root, 'test/types/cjs.cts' ), join ( consumer, 'consumer.cts' ) )
            const readme = readFileSync ( join ( consumer, 'node_modules/ask-for-promise/README.md' ), 'utf8' )
            const typesExample = readme.match ( /## TypeScript[\s\S]*?```ts\n([\s\S]*?)\n```/ )
            expect ( typesExample ).not.to.equal ( null )
            writeFileSync ( join ( consumer, 'readme.mts' ), typesExample[1] )
            const flags = [ tsc, '--noEmit', '--strict', '--verbatimModuleSyntax', '--target', 'ES2021' ]
            execFileSync ( process.execPath, [ ...flags, '--module', 'nodenext', '--moduleResolution', 'nodenext', 'consumer.mts', 'consumer.cts', 'readme.mts' ], { cwd: consumer, stdio: 'pipe' } )
            execFileSync ( process.execPath, [ ...flags, '--module', 'esnext', '--moduleResolution', 'bundler', 'consumer.mts' ], { cwd: consumer, stdio: 'pipe' } )
            const manifest = JSON.parse ( readFileSync ( join ( consumer, 'node_modules/ask-for-promise/package.json' ), 'utf8' ) )
            expect ( manifest.exports['.'].require.types ).to.equal ( './types/index.d.cts' )
        } finally {
            rmSync ( dir, { recursive: true, force: true } )
        }
    })
})
