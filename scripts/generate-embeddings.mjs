/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import { pipeline } from '@huggingface/transformers';
import { commands } from '../src/commands.js';

async function generateEmbeddings() {
	console.log(
		'🚀 Hey Wapuu: Warming up my super-brain to learn some commands...'
	);

	// Load the feature extraction pipeline
	const extractor = await pipeline(
		'feature-extraction',
		'Xenova/all-MiniLM-L6-v2'
	);

	const commandEmbeddings = [];

	for ( const command of commands ) {
		console.log( `🧠 Learning: "${ command.label }"` );

		// We embed each description (and the label) separately for maximum accuracy
		const phrases = [ command.label, ...command.descriptions ];
		const embeddings = [];

		for ( const phrase of phrases ) {
			const output = await extractor( phrase, {
				pooling: 'mean',
				normalize: true,
			} );
			embeddings.push( Array.from( output.data ) );
		}

		commandEmbeddings.push( {
			id: command.id,
			embeddings, // Store multiple vectors for one command
			context: command.context || null,
		} );
	}

	const buildDir = path.join( process.cwd(), 'build' );
	if ( ! fs.existsSync( buildDir ) ) {
		fs.mkdirSync( buildDir );
	}

	fs.writeFileSync(
		path.join( buildDir, 'embeddings.json' ),
		JSON.stringify( commandEmbeddings )
	);

	console.log( '✅ BOOM! My super-brain is now full of command knowledge!' );
}

generateEmbeddings().catch( ( err ) => {
	console.error( '😱 Oh no! My super-brain had a hiccup:', err );
	process.exit( 1 );
} );
