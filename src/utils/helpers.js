/**
 * Robust Sanitizer Helper
 *
 * @param {string} str The string to sanitize.
 */
export const sanitize = ( str ) => {
	if ( ! str || typeof str !== 'string' ) {
		return '';
	}
	let safe = str.replace(
		/[&<>"']/g,
		( m ) =>
			( {
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#39;',
			} )[ m ]
	);

	// Allow ONLY strong tags for bolding from AI
	safe = safe.replace(
		/&lt;strong&gt;(.*?)&lt;\/strong&gt;/g,
		'<strong>$1</strong>'
	);

	return safe;
};

/**
 * Validates a local URL to ensure it's safe
 *
 * @param {string} url The URL to validate.
 * @return {boolean} Whether the URL is safe.
 */
export const isSafeUrl = ( url ) => {
	if ( ! url ) {
		return false;
	}
	// Only allow relative paths or paths starting with admin.php / wp-admin
	return (
		url.startsWith( '/' ) ||
		url.startsWith( 'admin.php' ) ||
		url.includes( 'wp-admin' )
	);
};
