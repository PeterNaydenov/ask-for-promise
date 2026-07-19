import resolve    from '@rollup/plugin-node-resolve'
import commonjs   from '@rollup/plugin-commonjs'
import terser     from '@rollup/plugin-terser';


export default [
	// browser-friendly UMD build
	{
		input: 'src/askForPromise.js',
		output: {
			name: 'askForPromise',
			file: 'dist/ask-for-promise.umd.js',
			format: 'umd'
		},
		plugins: [
			resolve(), // so Rollup can find `ms`
			commonjs() // so Rollup can convert `ms` to an ES module
			, terser()
		]
	},

	// CommonJS (for Node). ES module consumers are served the raw
	// `src/askForPromise.js` via the `exports` field in package.json,
	// so no ESM dist build is needed.
	{
		input: 'src/askForPromise.js',
		output: [
			{ file: 'dist/ask-for-promise.cjs'    , format: 'cjs' }
		],
		plugins: [ terser() ]
	}
];