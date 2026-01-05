/* global self, navigator */
/* eslint-disable no-console */
import { pipeline, env } from '@huggingface/transformers';
import { findBestMatches } from './matcher.js';

// Global worker configuration
env.allowLocalModels = true;
env.localModelPath = ''; // Dynamic
env.allowRemoteModels = false; // Security: force local only
env.useBrowserCache = true; // Re-enable now that we have stable versioning
env.useCustomCache = true;

// Performance optimizations for modern browsers
if ( self.crossOriginIsolated ) {
	env.backends.onnx.wasm.numThreads = navigator.hardwareConcurrency || 4;
}
env.backends.onnx.wasm.simd = true; // Enable SIMD for 2-3x speedup

let extractor = null;
let commandEmbeddings = null;
let dynamicEmbeddings = [];
let hibernationTimer = null;

const HIBERNATION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

/**
 * Resets the hibernation timer
 */
function resetHibernation() {
	if ( hibernationTimer ) {
		clearTimeout( hibernationTimer );
	}
	hibernationTimer = setTimeout( () => {
		console.log( 'Wapuu Worker: Hibernating to save memory...' );
		extractor = null; // Release the model from memory
	}, HIBERNATION_TIMEOUT );
}

/**
 * Handle incoming messages from the UI thread
 *
 * @param {MessageEvent} event
 */
self.onmessage = async ( event ) => {
	const { type, data } = event.data;
	resetHibernation(); // Activity detected

	try {
		switch ( type ) {
			case 'init':
				await initWorker(
					data.embeddingsUrl,
					data.modelUrl,
					data.version
				);
				break;
			case 'learn':
				await handleLearn( data.commands );
				break;
			case 'query':
				// Wake up if hibernating
				if ( ! extractor ) {
					self.postMessage( {
						type: 'status',
						data: { status: 'loading', message: 'Waking up...' },
					} );
					await performInit(
						self.lastEmbeddingsUrl,
						self.lastModelUrl
					);
				}
				await handleInference( data.text, data.context );
				break;
		}
	} catch ( error ) {
		console.error( 'Worker Error:', error );
		self.postMessage( {
			type: 'error',
			data: { message: 'Brain hiccup! Try again?' },
		} );
	}
};

/**
 * Initialize the ML brain with Network Resilience
 *
 * @param {string} embeddingsUrl
 * @param {string} modelUrl
 * @param {string} version
 * @param {number} attempt
 */
async function initWorker( embeddingsUrl, modelUrl, version, attempt = 0 ) {
	const maxAttempts = 3;
	// Store for wake-up
	self.lastEmbeddingsUrl = embeddingsUrl;
	self.lastModelUrl = modelUrl;

	try {
		// TAB SYNC: Use WebLocks to ensure only one tab handles heavy init at a time
		if ( navigator.locks ) {
			await navigator.locks.request( 'hey_wapuu_init', async () => {
				await performInit( embeddingsUrl, modelUrl );
			} );
		} else {
			await performInit( embeddingsUrl, modelUrl );
		}
	} catch ( error ) {
		console.error( `Worker Init Error (Attempt ${ attempt + 1 }):`, error );

		if ( attempt < maxAttempts ) {
			const delay = Math.pow( 2, attempt ) * 1000;
			self.postMessage( {
				type: 'status',
				data: {
					status: 'loading',
					message: `Retrying in ${ delay / 1000 }s...`,
				},
			} );
			setTimeout(
				() =>
					initWorker( embeddingsUrl, modelUrl, version, attempt + 1 ),
				delay
			);
		} else {
			self.postMessage( { type: 'status', data: { status: 'error' } } );
		}
	}
}

/**
 * The actual heavy lifting of initialization
 *
 * @param {string} embeddingsUrl URL to the embeddings file.
 * @param {string} modelUrl      URL to the model folder.
 */
async function performInit( embeddingsUrl, modelUrl ) {
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
	const response = await fetch( embeddingsUrl, { cache: 'force-cache' } );
	if ( ! response.ok ) {
		throw new Error( 'Could not load embeddings' );
	}
	commandEmbeddings = await response.json();

	// Load the transformer pipeline
	extractor = await pipeline( 'feature-extraction', 'all-MiniLM-L6-v2', {
		quantized: true,
		fetch_options: {
			cache: 'force-cache',
		},
		progress_callback: ( progress ) => {
			if ( progress.status === 'downloading' ) {
				const percent = progress.total
					? `${ Math.round(
							( progress.loaded / progress.total ) * 100
					  ) }%`
					: `${ ( progress.loaded / 1024 / 1024 ).toFixed( 1 ) }MB`;

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
}

/**
 * Learn dynamic commands from the sidebar
 *
 * @param {Object[]} commands
 */
async function handleLearn( commands ) {
	if ( ! extractor || ! commands || commands.length === 0 ) {
		return;
	}

	const learned = [];
	for ( const cmd of commands ) {
		// Generate embedding for the dynamic label
		const output = await extractor( cmd.label, {
			pooling: 'mean',
			normalize: true,
		} );

		learned.push( {
			id: cmd.id,
			context: null,
			embeddings: [ Array.from( output.data ) ],
		} );
	}

	dynamicEmbeddings = learned;
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

		// Search static + dynamic
		const allEmbeddings = [ ...commandEmbeddings, ...dynamicEmbeddings ];

		const matches = findBestMatches(
			queryEmbedding,
			allEmbeddings,
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
