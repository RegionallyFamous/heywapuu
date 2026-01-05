import { useState, useEffect, useRef, useCallback } from '@wordpress/element';

/**
 * Hook for managing speech recognition
 *
 * @param {Function} onResult Callback when speech is recognized.
 */
export const useSpeechRecognition = ( onResult ) => {
	const [ isListening, setIsListening ] = useState( false );
	const recognitionRef = useRef( null );

	useEffect( () => {
		const SpeechRecognition =
			window.SpeechRecognition || window.webkitSpeechRecognition;
		if ( SpeechRecognition ) {
			recognitionRef.current = new SpeechRecognition();
			recognitionRef.current.continuous = false;
			recognitionRef.current.interimResults = false;
			recognitionRef.current.lang = 'en-US';

			recognitionRef.current.onresult = ( event ) => {
				const transcript = event.results[ 0 ][ 0 ].transcript;
				setIsListening( false );
				onResult( transcript );
			};

			recognitionRef.current.onerror = () => setIsListening( false );
			recognitionRef.current.onend = () => setIsListening( false );
		}
		return () => {
			if ( recognitionRef.current ) {
				recognitionRef.current.stop();
			}
		};
	}, [ onResult ] );

	const toggleListening = useCallback( () => {
		if ( isListening ) {
			recognitionRef.current?.stop();
		} else {
			try {
				setIsListening( true );
				recognitionRef.current?.start();
			} catch ( e ) {
				setIsListening( false );
			}
		}
	}, [ isListening ] );

	return { isListening, toggleListening };
};
