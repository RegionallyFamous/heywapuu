const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

module.exports = {
	...defaultConfig,
	entry: {
		index: path.resolve( process.cwd(), 'src', 'index.js' ),
		'nlu-worker': path.resolve( process.cwd(), 'src', 'nlu-worker.js' ),
	},
	output: {
		...defaultConfig.output,
		path: path.resolve( process.cwd(), 'build' ),
		filename: '[name].js',
	},
	resolve: {
		...defaultConfig.resolve,
		fallback: {
			...defaultConfig.resolve.fallback,
			fs: false,
			path: false,
			crypto: false,
		},
	},
};

