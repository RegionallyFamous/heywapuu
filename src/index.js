/* global sessionStorage, Audio, ajaxurl */
/* eslint-disable no-alert */
import {
	createRoot,
	useState,
	useEffect,
	useRef,
	useCallback,
	useMemo,
	Fragment,
} from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';

// Local Imports
import { commands as commandRegistry } from './commands.js';
import { searchFallback } from './fallback.js';
import { sanitize } from './utils/helpers.js';
import { TypewriterText } from './components/TypewriterText.js';
import { ActionCard } from './components/ActionCard.js';
import { useWapuuWorker } from './hooks/useWapuuWorker.js';
import { useSidebarScraper } from './hooks/useSidebarScraper.js';
import { useSpeechRecognition } from './hooks/useSpeechRecognition.js';
import './style.css';

/**
 * Hey Wapuu Chat App - Modular Edition (Stable Execution Order)
 */
const WapuuChatApp = () => {
	const config = window.heyWapuuConfig || {};

	// 1. STATE & REFS
	const [ isOpen, setIsOpen ] = useState( false );
	const [ input, setInput ] = useState( '' );
	const [ messages, setMessages ] = useState( () => {
		try {
			const saved = sessionStorage.getItem( 'hey_wapuu_history' );
			const parsed = saved ? JSON.parse( saved ) : [];
			return parsed.map( ( m ) => ( { ...m, hasTyped: true } ) );
		} catch ( e ) {
			return [];
		}
	} );

	const [ uiState, setUiState ] = useState( 'idle' );
	const [ matches, setMatches ] = useState( [] );
	const [ isThinking, setIsThinking ] = useState( false );
	const [ wapuuMood, setWapuuMood ] = useState( 'happy' );
	const [ isGlowing, setIsGlowing ] = useState( false );

	const scrollRef = useRef( null );
	const inputRef = useRef( null );
	const summonerRef = useRef( null );
	const chatWindowRef = useRef( null );
	const debounceTimerRef = useRef( null );

	// 2. DATA & CONTEXT
	const user = useMemo(
		() => ( {
			firstName: sanitize(
				config.user?.firstName || __( 'Friend', 'hey-wapuu' )
			),
		} ),
		[ config.user?.firstName ]
	);

	const site = useMemo(
		() => ( {
			name: sanitize(
				config.site?.name || __( 'your site', 'hey-wapuu' )
			),
			draftCount: parseInt( config.site?.draftCount || 0, 10 ),
			pendingComments: parseInt( config.site?.pendingComments || 0, 10 ),
			mediaCount: parseInt( config.site?.mediaCount || 0, 10 ),
			hasUpdates: !! config.site?.hasUpdates,
			activePlugins: parseInt( config.site?.activePlugins || 0, 10 ),
			postCount: parseInt( config.site?.postCount || 0, 10 ),
		} ),
		[ config.site ]
	);

	const context = useMemo( () => config.context || {}, [ config.context ] );

	// 3. HELPERS
	const triggerHaptic = useCallback( () => {
		if ( window.navigator?.vibrate ) {
			window.navigator.vibrate( 10 );
		}
	}, [] );

	const playPop = useCallback( () => {
		try {
			const audio = new Audio(
				'https://s3.amazonaws.com/freecodecamp/drums/Give_us_a_light.mp3'
			);
			audio.volume = 0.05;
			const playPromise = audio.play();
			if ( playPromise !== undefined ) {
				playPromise.catch( () => {} );
			}
		} catch ( e ) {}
	}, [] );

	const getCommandById = useCallback( ( id ) => {
		return commandRegistry.find( ( c ) => c.id === id ) || null;
	}, [] );

	const clearChat = useCallback( () => {
		if (
			window.confirm(
				__( 'Are you sure you want to clear the chat?', 'hey-wapuu' )
			)
		) {
			setMessages( [] );
			sessionStorage.removeItem( 'hey_wapuu_history' );
		}
	}, [] );

	// 4. CUSTOM HOOKS
	const dynamicCommands = useSidebarScraper();

	const findCommand = useCallback(
		( id ) => {
			return (
				getCommandById( id ) ||
				dynamicCommands.find( ( c ) => c.id === id )
			);
		},
		[ dynamicCommands, getCommandById ]
	);

	const handleWorkerError = useCallback( () => {
		setIsThinking( false );
		setMessages( ( prev ) => [
			...prev,
			{
				role: 'ai',
				text: __(
					'I encountered an error. Please try again.',
					'hey-wapuu'
				),
				hasTyped: false,
			},
		] );
	}, [] );

	const handleWorkerResults = useCallback(
		( data ) => {
			const { matches: foundMatches, isLive } = data;

			if ( isLive ) {
				setMatches( foundMatches );
				setUiState( foundMatches.length > 0 ? 'results' : 'searching' );
				if ( foundMatches.length > 0 && wapuuMood === 'happy' ) {
					setWapuuMood( 'thinking' );
					setTimeout( () => setWapuuMood( 'happy' ), 600 );
				}
				return;
			}

			setUiState( 'idle' );
			setIsThinking( false );
			setWapuuMood( 'wiggle' );
			setMatches( foundMatches );

			const topMatch =
				foundMatches.length > 0
					? findCommand( foundMatches[ 0 ].id )
					: null;
			let reply;

			if ( topMatch ) {
				const replies = [
					sprintf(
						/* translators: 1: user first name, 2: command explanation */
						__( 'I can help with that, %1$s. %2$s', 'hey-wapuu' ),
						user.firstName,
						topMatch.explanation
					),
					sprintf(
						/* translators: %s: user first name */
						__( 'You got it, %s.', 'hey-wapuu' ),
						user.firstName
					),
				];
				reply = replies[ Math.floor( Math.random() * replies.length ) ];
			} else {
				reply = __(
					"Hmm, I don't know that yet. Try asking something else!",
					'hey-wapuu'
				);
			}

			setMessages( ( prev ) => [
				...prev,
				{ role: 'ai', text: reply, hasTyped: false },
			] );
			setTimeout( () => setWapuuMood( 'happy' ), 1500 );
		},
		[ user.firstName, wapuuMood, findCommand ]
	);

	const {
		workerStatus,
		loadingProgress,
		isReadyNotification,
		isStuck,
		forceRestart,
		postToWorker,
	} = useWapuuWorker( {
		dynamicCommands,
		onResults: handleWorkerResults,
		onError: handleWorkerError,
	} );

	// 5. ACTION HANDLERS
	const handleSend = useCallback(
		( overrideInput ) => {
			const messageText = ( overrideInput || input ).trim();
			if ( ! messageText ) {
				return;
			}

			triggerHaptic();
			setMessages( ( prev ) => [
				...prev,
				{ role: 'user', text: messageText },
			] );
			if ( ! overrideInput ) {
				setInput( '' );
			}

			setUiState( 'thinking' );
			setIsThinking( true );
			setWapuuMood( 'thinking' );

			if ( workerStatus === 'ready' ) {
				postToWorker( {
					type: 'query',
					data: {
						text: messageText,
						context: context.postType || context.screenId,
					},
				} );
			} else {
				setTimeout( () => {
					setIsThinking( false );
					setWapuuMood( 'happy' );
					setMessages( ( prev ) => [
						...prev,
						{
							role: 'ai',
							text: __( 'I am still loading...', 'hey-wapuu' ),
							hasTyped: false,
						},
					] );
				}, 600 );
			}
		},
		[
			input,
			workerStatus,
			context,
			triggerHaptic,
			postToWorker,
		]
	);

	const onSpeechResult = useCallback(
		( transcript ) => {
			setInput( transcript );
			setTimeout( () => handleSend( transcript ), 500 );
		},
		[ handleSend ]
	);

	const { isListening, toggleListening } =
		useSpeechRecognition( onSpeechResult );

	const { executeCommand } = useDispatch( 'core/commands' );
	const allRegisteredCommands = useSelect(
		( select ) => select( 'core/commands' ).getCommands(),
		[]
	);

	const runCommand = useCallback(
		( commandId ) => {
			const cmd = findCommand( commandId );
			if ( ! cmd ) {
				return;
			}
			setMatches( [] );

			setMessages( ( prev ) => [
				...prev,
				{
					role: 'ai',
					text: __( 'Navigating to your destination.', 'hey-wapuu' ),
				},
			] );
			setWapuuMood( 'celebrate' );

			sessionStorage.setItem(
				'hey_wapuu_arrival',
				JSON.stringify( {
					id: commandId,
					label: cmd.label,
					time: Date.now(),
				} )
			);

			setTimeout( () => {
				const isRegistered = allRegisteredCommands.some(
					( c ) => c.name === commandId
				);
				if ( isRegistered ) {
					executeCommand( commandId );
					setIsOpen( false );
				} else if ( cmd.url ) {
					const baseUrl =
						typeof ajaxurl !== 'undefined'
							? ajaxurl.replace( 'admin-ajax.php', '' )
							: '/wp-admin/';
					window.location.href = cmd.url.startsWith( '/' )
						? cmd.url
						: baseUrl + cmd.url;
				}
			}, 800 );
		},
		[ allRegisteredCommands, executeCommand, findCommand ]
	);

	const handleSpecialAction = useCallback( ( action ) => {
		if ( action === 'help' ) {
			setMessages( ( prev ) => [
				...prev,
				{
					role: 'ai',
					text: __(
						'I can help you navigate WordPress. Try asking for the media library or a new post.',
						'hey-wapuu'
					),
				},
			] );
		}
	}, [] );

	// 6. EFFECTS
	useEffect( () => {
		if ( ! input.trim() ) {
			if ( uiState === 'searching' ) {
				setUiState( 'idle' );
				setMatches( [] );
			}
			return;
		}
		if ( workerStatus !== 'ready' ) {
			return;
		}

		setUiState( 'searching' );
		if ( debounceTimerRef.current ) {
			clearTimeout( debounceTimerRef.current );
		}
		debounceTimerRef.current = setTimeout( () => {
			postToWorker( {
				type: 'query',
				data: {
					text: input,
					context: context.postType || context.screenId,
					dynamicCommands,
					isLive: true,
				},
			} );
		}, 400 );
		return () => clearTimeout( debounceTimerRef.current );
	}, [
		input,
		workerStatus,
		dynamicCommands,
		context,
		uiState,
		postToWorker,
	] );

	useEffect( () => {
		if ( messages.length > 0 ) {
			sessionStorage.setItem(
				'hey_wapuu_history',
				JSON.stringify( messages.slice( -50 ) )
			);
		}
		if (
			messages.length > 0 &&
			messages[ messages.length - 1 ].role === 'ai'
		) {
			playPop();
		}
	}, [ messages, playPop ] );

	useEffect( () => {
		const handleKeyDown = ( e ) => {
			if (
				( e.altKey || ( e.ctrlKey && ! e.metaKey ) ) &&
				e.code === 'KeyW'
			) {
				setIsOpen( ( prev ) => ! prev );
				e.preventDefault();
				return;
			}
			if ( isOpen && e.key === 'Escape' ) {
				setIsOpen( false );
				e.preventDefault();
				summonerRef.current?.focus();
			}
		};
		window.addEventListener( 'keydown', handleKeyDown, true );
		return () =>
			window.removeEventListener( 'keydown', handleKeyDown, true );
	}, [ isOpen ] );

	useEffect( () => {
		if ( isOpen ) {
			setTimeout( () => inputRef.current?.focus(), 100 );
		}
	}, [ isOpen ] );

	useEffect( () => {
		if ( messages.length === 0 ) {
			setMessages( [
				{
					role: 'ai',
					text: sprintf(
						/* translators: %s: user first name */
						__( 'Hi %s, how can I help you today?', 'hey-wapuu' ),
						user.firstName
					),
					isInitial: true,
					hasTyped: false,
				},
			] );
		}
	}, [ messages.length, user.firstName ] );

	useEffect( () => {
		setIsGlowing( wapuuMood === 'thinking' || wapuuMood === 'celebrate' );
	}, [ wapuuMood ] );

	// --- RENDER ---
	const summonerClassName = [
		'hw-summoner',
		isOpen ? 'is-active' : '',
		isReadyNotification ? 'is-ready-notification' : '',
		`mood-${ wapuuMood }`,
	]
		.filter( Boolean )
		.join( ' ' );

	return (
		<>
			<button
				ref={ summonerRef }
				className={ summonerClassName }
				onClick={ () =>
					isStuck ? forceRestart() : setIsOpen( ! isOpen )
				}
				aria-expanded={ isOpen }
				aria-label={ __( 'Toggle Chat', 'hey-wapuu' ) }
			>
				{ isStuck ? '🔄' : isOpen ? '×' : '💬' }
			</button>

			{ isOpen && (
				<div
					className={ `hw-chat-window ${
						isGlowing ? 'is-glowing' : ''
					}` }
					role="dialog"
					aria-label={ __( 'Wapuu Assistant', 'hey-wapuu' ) }
					ref={ chatWindowRef }
				>
					<div className="hw-chat-header">
						<h2>
							{ isStuck
								? __( 'Restarting...', 'hey-wapuu' )
								: sprintf(
										/* translators: %s: user first name */
										__( 'Hi %s', 'hey-wapuu' ),
										user.firstName
								  ) }
						</h2>
						<div className="hw-header-actions">
							<button
								onClick={ clearChat }
								className="hw-clear-btn"
								title={ __( 'Clear Chat', 'hey-wapuu' ) }
							>
								{ __( 'Clear', 'hey-wapuu' ) }
							</button>
							<button
								onClick={ () => setIsOpen( false ) }
								className="hw-close-btn"
							>
								×
							</button>
						</div>
					</div>

					{ workerStatus !== 'ready' && (
						<div className="hw-progress-container">
							<div
								className="hw-progress-bar"
								style={ { width: `${ loadingProgress }%` } }
							/>
						</div>
					) }

					<div className="hw-chat-content" ref={ scrollRef }>
						{ messages.map( ( msg, i ) => (
							<Fragment key={ i }>
								<div
									className={ `hw-bubble hw-bubble-${ msg.role }` }
								>
									{ msg.role === 'ai' && ! msg.hasTyped ? (
										<TypewriterText
											text={ msg.text }
											onComplete={ () => {
												setMessages( ( prev ) => {
													const newMsgs = [ ...prev ];
													newMsgs[ i ] = {
														...newMsgs[ i ],
														hasTyped: true,
													};
													return newMsgs;
												} );
											} }
										/>
									) : (
										<span
											dangerouslySetInnerHTML={ {
												__html: sanitize(
													msg.text
												).replace(
													/\*\*(.*?)\*\*/g,
													'<strong>$1</strong>'
												),
											} }
										/>
									) }
								</div>
								{ msg.type === 'card' && (
									<ActionCard
										type={ msg.cardType }
										data={ msg.data }
										onAction={ runCommand }
									/>
								) }
							</Fragment>
						) ) }
						{ isThinking && (
							<div className="hw-bubble hw-bubble-ai hw-thinking">
								...
							</div>
						) }
					</div>

					{ matches.length > 0 && (
						<div className="hw-suggestions">
							{ matches.map( ( match ) => {
								const cmd = findCommand( match.id );
								return cmd ? (
									<button
										key={ match.id }
										className="hw-match-card"
										onClick={ () => runCommand( match.id ) }
									>
										<strong>{ cmd.label }</strong>
										<span>{ cmd.explanation }</span>
									</button>
								) : null;
							} ) }
						</div>
					) }

					<div
						className={ `hw-input-area ${
							workerStatus !== 'ready' ? 'is-disabled' : ''
						}` }
					>
						<button
							className={ `hw-mic-btn ${
								isListening ? 'is-listening' : ''
							}` }
							onClick={ toggleListening }
						>
							{ isListening ? '🛑' : '🎤' }
						</button>
						<input
							ref={ inputRef }
							type="text"
							value={ input }
							disabled={ workerStatus !== 'ready' }
							onChange={ ( e ) => setInput( e.target.value ) }
							onKeyDown={ ( e ) =>
								e.key === 'Enter' && handleSend()
							}
							placeholder={
								workerStatus === 'ready'
									? __( 'Ask me anything...', 'hey-wapuu' )
									: __( 'Loading...', 'hey-wapuu' )
							}
						/>
						<button
							className="hw-send-btn"
							onClick={ () => handleSend() }
							disabled={ workerStatus !== 'ready' }
						>
							{ __( 'Go', 'hey-wapuu' ) }
						</button>
					</div>
				</div>
			) }
		</>
	);
};

const init = () => {
	if ( typeof wp !== 'undefined' && wp.element ) {
		const rootElement =
			document.getElementById( 'hey-wapuu-root' ) ||
			( () => {
				const el = document.createElement( 'div' );
				el.id = 'hey-wapuu-root';
				document.body.appendChild( el );
				return el;
			} )();
		createRoot( rootElement ).render( <WapuuChatApp /> );
	}
};

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', init );
} else {
	init();
}
