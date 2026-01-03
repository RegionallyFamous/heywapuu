import Fuse from 'fuse.js';
import { commands } from './commands.js';

let fuse;

/**
 * Initializes the fallback search
 */
export function initFallback() {
	const options = {
		keys: [ 'label', 'descriptions' ],
		threshold: 0.4,
		includeScore: true,
	};

	fuse = new Fuse( commands, options );
}

/**
 * Performs a fuzzy search as a fallback
 *
 * @param {string} text
 */
export function searchFallback( text ) {
	if ( ! fuse ) {
		initFallback();
	}

	const results = fuse.search( text );

	// Map to same format as NLU results
	return results.slice( 0, 3 ).map( ( result ) => ( {
		id: result.item.id,
		score: 1 - result.score, // Fuse score is 0 for perfect match
	} ) );
}
