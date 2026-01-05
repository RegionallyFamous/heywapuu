/* global self */
/* eslint-disable no-console */
import { pipeline, env } from '@huggingface/transformers';
import { findBestMatches } from './matcher.js';

// Global worker configuration
env.allowLocalModels = true;
env.localModelPath = ''; // Dynamic
env.allowRemoteModels = false; // Security: force local only
env.useBrowserCache = false; // Disable for now to ensure we get the fresh quantized model
env.useCustomCache = false;

let extractor = null;
let commandEmbeddings = null;

/**
 * Handle incoming messages from the UI thread
 *
 * @param {MessageEvent} event
 */
self.onmessage = async ( event ) => {
	const { type, data } = event.data;

	try {
		switch ( type ) {
			case 'init':
				await initWorker( data.embeddingsUrl, data.modelUrl, data.version );
				break;
			case 'query':
				await handleInference( data.text, data.context );
				break;
		}
	} catch ( error ) {
		console.error( 'Worker Error:', error );
		self.postMessage( { type: 'error', data: { message: error.message } } );
	}
};

/**
 * Initialize the ML brain
 *
 * @param {string} embeddingsUrl
 * @param {string} modelUrl
 * @param {string} version
 */
async function initWorker( embeddingsUrl, modelUrl, version ) {
	try {
		self.postMessage( {
			type: 'status',
			data: {
				status: 'loading',
			},
		} );

		if ( modelUrl ) {
			env.localModelPath = modelUrl;
		}

		// Load pre-computed embeddings
		const response = await fetch( embeddingsUrl );
		if ( ! response.ok ) {
			throw new Error( 'Could not load embeddings' );
		}
		commandEmbeddings = await response.json();

		// Load the transformer pipeline
		extractor = await pipeline( 'feature-extraction', 'all-MiniLM-L6-v2', {
			quantized: true,
			fetch_options: {
				cache: 'no-cache', // Bypass browser cache for the .onnx file
			},
			progress_callback: ( progress ) => {
				if ( progress.status === 'downloading' ) {
					const percent = progress.total
						? `${ Math.round(
								( progress.loaded / progress.total ) * 100
						  ) }%`
						: `${ ( progress.loaded / 1024 / 1024 ).toFixed(
								1
						  ) }MB`;

					self.postMessage( {
						type: 'status',
						data: {
							status: 'downloading',
							percent,
						},
					} );
				}
			},
		} );

		self.postMessage( {
			type: 'status',
			data: {
				status: 'ready',
			},
		} );
	} catch ( error ) {
		console.error( 'Worker Init Error:', error );
		self.postMessage( {
			type: 'status',
			data: {
				status: 'error',
			},
		} );
	}
}

/**
 * Perform semantic search
 *
 * @param {string} text
 * @param {string} context
 */
async function handleInference( text, context ) {
	if ( ! extractor || ! commandEmbeddings ) {
		return;
	}

	try {
		// Generate embedding for query
		const output = await extractor( text, {
			pooling: 'mean',
			normalize: true,
		} );

		const queryEmbedding = Array.from( output.data );
		const matches = findBestMatches(
			queryEmbedding,
			commandEmbeddings,
			context
		);

		self.postMessage( { type: 'results', data: { matches } } );
	} catch ( error ) {
		console.error( 'Inference Error:', error );
		self.postMessage( {
			type: 'error',
			data: {
				message:
					"I got a bit confused by that one! Maybe try saying it a different way? I'm still learning! 🤔",
			},
		} );
	}
}
