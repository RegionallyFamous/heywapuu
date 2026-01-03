/**
 * Computes cosine similarity between two vectors
 *
 * @param {number[]} vecA
 * @param {number[]} vecB
 */
export function cosineSimilarity( vecA, vecB ) {
	let dotProduct = 0;
	let normA = 0;
	let normB = 0;

	const len = vecA.length;
	// Use local variables for speed
	for ( let i = 0; i < len; i++ ) {
		const a = vecA[ i ];
		const b = vecB[ i ];
		dotProduct += a * b;
		normA += a * a;
		normB += b * b;
	}

	if ( normA === 0 || normB === 0 ) {
		return 0;
	}
	return dotProduct / ( Math.sqrt( normA ) * Math.sqrt( normB ) );
}

/**
 * Finds the top N matches for a given query embedding
 *
 * @param {number[]} queryEmbedding
 * @param {Object[]} commandEmbeddings
 * @param {string}   currentContext
 * @param {number}   threshold
 * @param {number}   limit
 */
export function findBestMatches(
	queryEmbedding,
	commandEmbeddings,
	currentContext = null,
	threshold = 0.5,
	limit = 3
) {
	const results = [];

	const cmdLen = commandEmbeddings.length;
	for ( let i = 0; i < cmdLen; i++ ) {
		const cmd = commandEmbeddings[ i ];
		let bestScore = 0;

		// Handle both new and old embedding structures
		const descEmbeds =
			cmd.descriptionEmbeddings ||
			cmd.embeddings ||
			( cmd.embedding ? [ cmd.embedding ] : null );

		if ( descEmbeds ) {
			const descLen = descEmbeds.length;
			for ( let j = 0; j < descLen; j++ ) {
				const score = cosineSimilarity(
					queryEmbedding,
					descEmbeds[ j ]
				);
				if ( score > bestScore ) {
					bestScore = score;
				}
			}
		}

		// Boost score if the command context matches current context
		if ( currentContext && cmd.context === currentContext ) {
			bestScore += 0.15;
		}

		if ( bestScore >= threshold ) {
			results.push( {
				id: cmd.id,
				score: bestScore,
			} );
		}
	}

	// Sort by score descending and take the limit
	return results.sort( ( a, b ) => b.score - a.score ).slice( 0, limit );
}
