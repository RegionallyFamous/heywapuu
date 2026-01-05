import { useState, useEffect, useRef } from '@wordpress/element';
import { sanitize } from '../utils/helpers.js';

/**
 * Typewriter Effect Component
 *
 * @param {Object}   root0              Props object.
 * @param {string}   root0.text         The text to type.
 * @param {number}   [root0.speed=25]   Typing speed in ms.
 * @param {Function} [root0.onComplete] Callback when typing finishes.
 */
export const TypewriterText = ( { text, speed = 25, onComplete } ) => {
	const [ displayedText, setDisplayedText ] = useState( '' );
	const indexRef = useRef( 0 );
	const lastTimeRef = useRef( 0 );

	useEffect( () => {
		let rafId;

		const step = ( time ) => {
			if ( ! lastTimeRef.current ) {
				lastTimeRef.current = time;
			}

			const delta = time - lastTimeRef.current;

			if ( delta >= speed ) {
				if ( indexRef.current < text.length ) {
					setDisplayedText( text.slice( 0, indexRef.current + 1 ) );
					indexRef.current++;
					lastTimeRef.current = time;
				} else {
					if ( onComplete ) {
						onComplete();
					}
					return;
				}
			}

			rafId = window.requestAnimationFrame( step );
		};

		rafId = window.requestAnimationFrame( step );
		return () => window.cancelAnimationFrame( rafId );
	}, [ text, speed, onComplete ] );

	const renderedHtml = sanitize( displayedText ).replace(
		/\*\*(.*?)\*\*/g,
		'<strong>$1</strong>'
	);

	return (
		<>
			<span dangerouslySetInnerHTML={ { __html: renderedHtml } } />
			{ indexRef.current < text.length && (
				<span className="hw-typewriter-cursor" />
			) }
		</>
	);
};
