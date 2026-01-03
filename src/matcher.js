/**
 * Computes cosine similarity between two vectors
 */
export function cosineSimilarity(vecA, vecB) {
	let dotProduct = 0;
	let normA = 0;
	let normB = 0;
	
	const len = vecA.length;
	for (let i = 0; i < len; i++) {
		const a = vecA[i];
		const b = vecB[i];
		dotProduct += a * b;
		normA += a * a;
		normB += b * b;
	}
	
	if (normA === 0 || normB === 0) return 0;
	return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Finds the top N matches for a given query embedding
 */
export function findBestMatches(queryEmbedding, commandEmbeddings, currentContext = null, threshold = 0.5, limit = 3) {
	const results = [];

	const cmdLen = commandEmbeddings.length;
	for (let i = 0; i < cmdLen; i++) {
		const cmd = commandEmbeddings[i];
		let bestScore = 0;

		if (cmd.descriptionEmbeddings) {
			// Newer structure with descriptionEmbeddings array
			const descLen = cmd.descriptionEmbeddings.length;
			for (let j = 0; j < descLen; j++) {
				const score = cosineSimilarity(queryEmbedding, cmd.descriptionEmbeddings[j]);
				if (score > bestScore) bestScore = score;
			}
		} else if (cmd.embeddings) {
			// Compatibility with old structure
			const embLen = cmd.embeddings.length;
			for (let j = 0; j < embLen; j++) {
				const score = cosineSimilarity(queryEmbedding, cmd.embeddings[j]);
				if (score > bestScore) bestScore = score;
			}
		} else if (cmd.embedding) {
			bestScore = cosineSimilarity(queryEmbedding, cmd.embedding);
		}
		
		// Boost score if the command context matches current context
		if (currentContext && cmd.context === currentContext) {
			bestScore += 0.15;
		}
		
		if (bestScore >= threshold) {
			results.push({
				id: cmd.id,
				score: bestScore
			});
		}
	}

	// Sort by score descending and take the limit
	return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
