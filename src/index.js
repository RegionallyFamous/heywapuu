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

	// 1. STATE (Declarations first)
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

	// 2. DATA & CONTEXT (Staticish data)
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

	// 3. LOW-LEVEL HELPERS (No hook dependencies)
	const getCommandById = useCallback(
		( id ) => {
			// Search both registries
			const found = commandRegistry.find( ( c ) => c.id === id );
			if ( found ) {
				return found;
			}
			// Note: dynamicCommands is handled via closure if needed,
			// but we'll pass it explicitly in the handleWorkerResults.
			return null;
		},
		[]
	);

	const triggerHaptic = useCallback( () => {
		if ( window.navigator?.vibrate ) {
			window.navigator.vibrate( 10 );
		}
	}, [] );

	// 4. HIGH-LEVEL CUSTOM HOOKS
	const dynamicCommands = useSidebarScraper();

	// Specialized lookup that includes dynamic commands
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
					sprintf(
						/* translators: 1: user first name, 2: command explanation */
						__( 'I know where that is, %1$s. %2$s', 'hey-wapuu' ),
						user.firstName,
						topMatch.explanation
					),
					sprintf(
						/* translators: 1: user first name, 2: command explanation */
						__( 'That is a great idea, %1$s. %2$s', 'hey-wapuu' ),
						user.firstName,
						topMatch.explanation
					),
				];
				reply = replies[ Math.floor( Math.random() * replies.length ) ];
			} else {
				const fallbacks = [
					__(
						"Hmm, I don't know that yet. Try asking to start a post or open the media library.",
						'hey-wapuu'
					),
					__(
						'I could not find a matching command. Can we try a different search?',
						'hey-wapuu'
					),
					sprintf(
						/* translators: %s: user first name */
						__(
							'I am not sure how to do that, %s. Should we try one of these instead?',
							'hey-wapuu'
						),
						user.firstName
					),
					__(
						'I have not learned that yet. Want to see what I can do?',
						'hey-wapuu'
					),
				];
				reply =
					fallbacks[ Math.floor( Math.random() * fallbacks.length ) ];
				setMatches( [
					{ id: 'core/add-new-post', score: 0.1 },
					{ id: 'core/open-media-library', score: 0.1 },
					{ id: 'wapuu/tell-joke', score: 0.1 },
				] );
			}

			setMessages( ( prev ) => [
				...prev,
				{ role: 'ai', text: reply, hasTyped: false },
			] );
			setTimeout( () => {
				setWapuuMood( 'happy' );
				setIsGlowing( false );
			}, 1500 );
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

	// 5. ACTION HANDLERS (Depends on Worker and State)
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

			const fastMatch = searchFallback( messageText );
			const isExactMatch = fastMatch.some( ( m ) => {
				const cmd = findCommand( m.id );
				return (
					cmd &&
					cmd.label
						.toLowerCase()
						.includes( messageText.toLowerCase() )
				);
			} );

			if ( isExactMatch && fastMatch.length === 1 ) {
				setTimeout( () => {
					setIsThinking( false );
					setWapuuMood( 'happy' );
					setMatches( fastMatch );
					setMessages( ( prev ) => [
						...prev,
						{
							role: 'ai',
							text: sprintf(
								/* translators: %s: user first name */
								__(
									'I have found that for you, %s.',
									'hey-wapuu'
								),
								user.firstName
							),
							hasTyped: false,
						},
					] );
				}, 50 );
				return;
			}

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
					const fallback = searchFallback( messageText );
					setIsThinking( false );
					setWapuuMood( 'happy' );
					if ( fallback.length > 0 ) {
						setMatches( fallback );
						setMessages( ( prev ) => [
							...prev,
							{
								role: 'ai',
								text: __(
									'I am still initializing, but here are some likely matches.',
									'hey-wapuu'
								),
								hasTyped: false,
							},
						] );
					} else {
						setMessages( ( prev ) => [
							...prev,
							{
								role: 'ai',
								text: __(
									'Please wait a moment while I finish loading my database.',
									'hey-wapuu'
								),
								hasTyped: false,
							},
						] );
					}
				}, 600 );
			}
		},
		[
			input,
			workerStatus,
			context,
			triggerHaptic,
			user.firstName,
			postToWorker,
			findCommand,
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

	const handleSpecialAction = useCallback(
		( action ) => {
			const actions = {
				joke: () => {
					const jokes = [
						__(
							'Why did the WordPress developer go broke? Because he kept giving out all his themes for free.',
							'hey-wapuu'
						),
						__(
							"What is a WordPress developer's favorite drink? Root beer.",
							'hey-wapuu'
						),
						__(
							"How many WordPress developers does it take to change a lightbulb? Just one, but they'll need to install 20 plugins first.",
							'hey-wapuu'
						),
						__(
							'Why was the WordPress site so good at baseball? Because it had a great pitch.',
							'hey-wapuu'
						),
						__(
							'What did the server say to the plugin? "You\'re really starting to get on my nerves!"',
							'hey-wapuu'
						),
					];
					setMessages( ( prev ) => [
						...prev,
						{
							role: 'ai',
							text: jokes[
								Math.floor( Math.random() * jokes.length )
							],
						},
					] );
				},
				about: () => {
					setMessages( ( prev ) => [
						...prev,
						{
							role: 'ai',
							text: __(
								'I am a mythical creature called a "Kappa" from Tokyo, Japan. I am here to help you build with WordPress.',
								'hey-wapuu'
							),
						},
					] );
				},
				song: () => {
					setMessages( ( prev ) => [
						...prev,
						{
							role: 'ai',
							text: __(
								'WordPress is the place to be, building worlds for you and me. With a block here and a block there, we make magic everywhere.',
								'hey-wapuu'
							),
						},
					] );
				},
				why: () => {
					setMessages( ( prev ) => [
						...prev,
						{
							role: 'ai',
							text: __(
								'I use a local machine learning model to understand your requests directly in your browser.',
								'hey-wapuu'
							),
						},
					] );
				},
				tips: () => {
					const buildTips = [
						__(
							'Start with a clear title for your post.',
							'hey-wapuu'
						),
						__(
							'Use the media library to manage your images.',
							'hey-wapuu'
						),
						__(
							'Use the site editor to change global styles and colors.',
							'hey-wapuu'
						),
						__(
							'Create pages for static content like "About" or "Contact".',
							'hey-wapuu'
						),
					];
					setMessages( ( prev ) => [
						...prev,
						{
							role: 'ai',
							text: buildTips[
								Math.floor( Math.random() * buildTips.length )
							],
						},
					] );
				},
				help: () => {
					setMessages( ( prev ) => [
						...prev,
						{
							role: 'ai',
							text:
								__(
									'I can help you manage posts, pages, media, and styles. Try asking things like:',
									'hey-wapuu'
								) +
								'\n\n• "Create a new post"\n• "Show media library"\n• "Open site editor"\n• "Tell me a joke"',
						},
					] );
					setMatches( [
						{ id: 'core/add-new-post', score: 0.1 },
						{ id: 'core/open-media-library', score: 0.1 },
						{ id: 'core/open-site-editor', score: 0.1 },
						{ id: 'wapuu/tell-joke', score: 0.1 },
					] );
				},
				status: () => {
					let statusText = sprintf(
						/* translators: 1: theme name, 2: active plugins count */
						__(
							'Your site is using the **%1$s** theme and has **%2$d** active plugins.',
							'hey-wapuu'
						),
						config.site?.themeName || 'WordPress',
						site.activePlugins
					);
					if ( site.pendingComments > 0 ) {
						statusText +=
							'\n\n' +
							sprintf(
								/* translators: %d: number of pending comments */
								__(
									'There are %d comments pending moderation.',
									'hey-wapuu'
								),
								site.pendingComments
							);
					}
					if ( site.hasUpdates ) {
						statusText +=
							'\n\n' +
							__(
								'There are updates available for your site.',
								'hey-wapuu'
							);
					}
					setMessages( ( prev ) => [
						...prev,
						{ role: 'ai', text: statusText },
					] );
				},
			};
			if ( actions[ action ] ) {
				actions[ action ]();
			}
		},
		[ site, user.firstName, config.site?.themeName ]
	);

	const runCommand = useCallback(
		( commandId ) => {
			const cmd = findCommand( commandId );
			if ( ! cmd ) {
				return;
			}
			setMatches( [] );

			if ( cmd.action ) {
				handleSpecialAction( cmd.action );
				return;
			}

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
		[
			allRegisteredCommands,
			executeCommand,
			handleSpecialAction,
			findCommand,
		]
	);

	// 6. EFFECT HOOKS
	const getScreenContext = useCallback( () => {
		const screenId = context.screenId || '';
		const isEditing = !! context.isEditing;

		if ( screenId === 'site-editor' ) {
			return {
				name: __( 'the editor', 'hey-wapuu' ),
				nudge: __(
					'Want to change your site appearance?',
					'hey-wapuu'
				),
			};
		}
		if ( isEditing ) {
			return {
				name: __( 'the editor', 'hey-wapuu' ),
				nudge: __( 'Need help with this post?', 'hey-wapuu' ),
			};
		}
		if ( screenId === 'plugins' ) {
			return {
				name: __( 'plugins', 'hey-wapuu' ),
				nudge: __( 'Looking for new features?', 'hey-wapuu' ),
			};
		}
		if ( screenId === 'upload' ) {
			return {
				name: __( 'media', 'hey-wapuu' ),
				nudge: __( 'Searching for a file?', 'hey-wapuu' ),
			};
		}
		if ( screenId === 'themes' ) {
			return {
				name: __( 'themes', 'hey-wapuu' ),
				nudge: __( 'Checking out new designs?', 'hey-wapuu' ),
			};
		}
		if ( screenId === 'users' ) {
			return {
				name: __( 'users', 'hey-wapuu' ),
				nudge: __( 'Managing your team?', 'hey-wapuu' ),
			};
		}
		return {
			name: __( 'this page', 'hey-wapuu' ),
			nudge: __( 'How can I help you today?', 'hey-wapuu' ),
		};
	}, [ context ] );

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
		isThinking,
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
				e.stopPropagation();
				return;
			}
			if ( isOpen ) {
				if ( e.key === 'Escape' ) {
					setIsOpen( false );
					e.preventDefault();
					e.stopPropagation();
					summonerRef.current?.focus();
					return;
				}
				if ( e.key === 'Tab' && chatWindowRef.current ) {
					const focusableElements =
						chatWindowRef.current.querySelectorAll(
							'button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])'
						);
					const focusable = Array.from( focusableElements );
					if ( focusable.length === 0 ) {
						return;
					}
					const first = focusable[ 0 ];
					const last = focusable[ focusable.length - 1 ];
					const activeElement =
						chatWindowRef.current.ownerDocument.activeElement;
					if ( e.shiftKey && activeElement === first ) {
						last.focus();
						e.preventDefault();
					} else if ( ! e.shiftKey && activeElement === last ) {
						first.focus();
						e.preventDefault();
					}
				}
			}
		};
		window.addEventListener( 'keydown', handleKeyDown, true );
		return () =>
			window.removeEventListener( 'keydown', handleKeyDown, true );
	}, [ isOpen ] );

	useEffect( () => {
		if ( isOpen ) {
			const timer = setTimeout( () => inputRef.current?.focus(), 100 );
			return () => clearTimeout( timer );
		}
	}, [ isOpen ] );

	useEffect( () => {
		const arrivalData = sessionStorage.getItem( 'hey_wapuu_arrival' );
		if ( arrivalData ) {
			try {
				const { id, label, time } = JSON.parse( arrivalData );
				if ( Date.now() - time < 60000 ) {
					let arrivalMessage = sprintf(
						/* translators: %s: destination label */
						__(
							'You have arrived at: **%s**. How else can I help?',
							'hey-wapuu'
						),
						label
					);
					if ( id === 'core/add-new-post' ) {
						arrivalMessage = __(
							'You can now start writing your new post.',
							'hey-wapuu'
						);
					} else if ( id === 'core/open-media-library' ) {
						arrivalMessage = __(
							'You are now in the media library.',
							'hey-wapuu'
						);
					} else if ( id === 'core/open-site-editor' ) {
						arrivalMessage = __(
							'You are now in the site editor.',
							'hey-wapuu'
						);
					}

					setTimeout( () => {
						setMessages( ( prev ) => [
							...prev,
							{
								role: 'ai',
								text: arrivalMessage,
								hasTyped: false,
							},
						] );
						if ( id === 'core/add-new-post' ) {
							setTimeout( () => {
								setMessages( ( prev ) => [
									...prev,
									{
										role: 'ai',
										type: 'card',
										cardType: 'post',
										hasTyped: true,
										data: {
											message: __(
												'Need help with writing headlines?',
												'hey-wapuu'
											),
											primaryAction: {
												id: 'wapuu/show-tips',
												label: __(
													'Show Tips',
													'hey-wapuu'
												),
											},
										},
									},
								] );
							}, 3000 );
						}
						setIsOpen( true );
						setWapuuMood( 'celebrate' );
						setTimeout( () => setWapuuMood( 'happy' ), 2000 );
					}, 1000 );
				}
			} catch ( e ) {}
			sessionStorage.removeItem( 'hey_wapuu_arrival' );
		}

		if ( messages.length === 0 ) {
			const hour = new Date().getHours();
			let timeGreeting = __( 'Good morning', 'hey-wapuu' );
			if ( hour >= 12 && hour < 18 ) {
				timeGreeting = __( 'Good afternoon', 'hey-wapuu' );
			} else if ( hour >= 18 ) {
				timeGreeting = __( 'Good evening', 'hey-wapuu' );
			}

			const screenContext = getScreenContext();
			const contextNote = screenContext.nudge;

			const greetings = [
				sprintf(
					/* translators: 1: time greeting (e.g. Good morning), 2: user first name, 3: site name, 4: contextual note */
					__(
						'%1$s, %2$s. What can I help you build on **%3$s** today? %4$s',
						'hey-wapuu'
					),
					timeGreeting,
					user.firstName,
					site.name,
					contextNote
				),
				sprintf(
					/* translators: 1: user first name, 2: site name, 3: contextual note */
					__(
						'Hi %1$s. How can I help you with **%2$s**? %3$s',
						'hey-wapuu'
					),
					user.firstName,
					site.name,
					contextNote
				),
				sprintf(
					/* translators: 1: user first name, 2: site name, 3: contextual note */
					__(
						'Welcome back, %1$s. I am ready to help with **%2$s**. %3$s',
						'hey-wapuu'
					),
					user.firstName,
					site.name,
					contextNote
				),
			];

			let welcomeText =
				greetings[ Math.floor( Math.random() * greetings.length ) ];

			if ( site.draftCount > 0 && ! context.isEditing ) {
				welcomeText +=
					' ' +
					sprintf(
						/* translators: %d: number of draft posts */
						__( 'You have %d draft posts.', 'hey-wapuu' ),
						site.draftCount
					);
			}
			if ( site.pendingComments > 0 ) {
				welcomeText +=
					' ' +
					sprintf(
						/* translators: %d: number of pending comments */
						__(
							'There are %d comments pending moderation.',
							'hey-wapuu'
						),
						site.pendingComments
					);
			}
			if ( site.hasUpdates ) {
				welcomeText +=
					' ' +
					__(
						'There are updates available for your site.',
						'hey-wapuu'
					);
			}
			if ( site.mediaCount > 50 && Math.random() > 0.7 ) {
				welcomeText +=
					' ' +
					sprintf(
						/* translators: %d: number of media items */
						__(
							'Your media library contains %d items.',
							'hey-wapuu'
						),
						site.mediaCount
					);
			}

			setTimeout(
				() =>
					setMessages( [
						{
							role: 'ai',
							text: welcomeText,
							isInitial: true,
							hasTyped: false,
						},
					] ),
				300
			);
		}
	}, [
		messages.length,
		context,
		site,
		user.firstName,
		getScreenContext,
		findCommand,
	] );

	useEffect( () => {
		if (
			workerStatus === 'ready' &&
			messages.length === 1 &&
			messages[ 0 ].isInitial
		) {
			setTimeout( () => {
				if ( site.draftCount > 0 ) {
					setMessages( ( prev ) => [
						...prev,
						{
							role: 'ai',
							type: 'card',
							cardType: 'drafts',
							hasTyped: true,
							data: {
								message: sprintf(
									/* translators: %d: draft count */
									__(
										'You have %d draft posts. Would you like to view them?',
										'hey-wapuu'
									),
									site.draftCount
								),
								primaryAction: {
									id: 'core/open-post-library',
									label: __( 'View Drafts', 'hey-wapuu' ),
								},
							},
						},
					] );
				} else if ( site.hasUpdates ) {
					setMessages( ( prev ) => [
						...prev,
						{
							role: 'ai',
							type: 'card',
							cardType: 'updates',
							hasTyped: true,
							data: {
								message: __(
									'There are updates available for your site.',
									'hey-wapuu'
								),
								primaryAction: {
									id: 'core/open-updates',
									label: __( 'Update Now', 'hey-wapuu' ),
								},
							},
						},
					] );
				} else if ( site.postCount === 0 ) {
					setMessages( ( prev ) => [
						...prev,
						{
							role: 'ai',
							type: 'card',
							cardType: 'post',
							hasTyped: true,
							data: {
								message: __(
									'Your site has no posts. Would you like to create one?',
									'hey-wapuu'
								),
								primaryAction: {
									id: 'core/add-new-post',
									label: __( 'Create Post', 'hey-wapuu' ),
								},
							},
						},
					] );
				}
			}, 2000 );
		}
	}, [ workerStatus, site, messages ] );

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

	let inputPlaceholder = __( 'Type a message...', 'hey-wapuu' );
	if ( workerStatus !== 'ready' ) {
		inputPlaceholder = __( 'Initializing...', 'hey-wapuu' );
		if ( isStuck ) {
			inputPlaceholder = __(
				'System error. Click to restart.',
				'hey-wapuu'
			);
		}
	} else if ( isListening ) {
		inputPlaceholder = __( 'Listening...', 'hey-wapuu' );
	}

	const getSummonerIcon = () => {
		if ( isStuck ) {
			return '🔄';
		}
		return isOpen ? '×' : '💬';
	};

	return (
		<>
			<button
				ref={ summonerRef }
				className={ summonerClassName }
				onClick={ () =>
					isStuck ? forceRestart() : setIsOpen( ! isOpen )
				}
				aria-expanded={ isOpen }
				aria-haspopup="dialog"
				aria-label={
					isOpen
						? __( 'Close Chat', 'hey-wapuu' )
						: __( 'Open Chat', 'hey-wapuu' )
				}
			>
				{ getSummonerIcon() }
			</button>

			{ isOpen && (
				<div
					className={ `hw-chat-window ${
						isGlowing ? 'is-glowing' : ''
					}` }
					role="dialog"
					aria-modal="true"
					aria-label={ __( 'Wapuu Assistant', 'hey-wapuu' ) }
					ref={ chatWindowRef }
				>
					<div className="hw-chat-header">
						<h2 id="hw-chat-title">
							{ isStuck
								? __( 'System Restart', 'hey-wapuu' )
								: sprintf(
										/* translators: %s: user first name */
										__( 'Hi %s', 'hey-wapuu' ),
										user.firstName
								  ) }
						</h2>
						<div className="hw-header-actions">
							{ isStuck && (
								<button
									onClick={ forceRestart }
									className="hw-wake-btn"
									title={ __(
										'Force Restart AI',
										'hey-wapuu'
									) }
								>
									{ __( 'Wake Up', 'hey-wapuu' ) }
								</button>
							) }
							<button
								onClick={ () => handleSpecialAction( 'help' ) }
								disabled={ workerStatus !== 'ready' }
								aria-label={ __( 'Help', 'hey-wapuu' ) }
								className="hw-help-btn"
								title={ __( 'Help', 'hey-wapuu' ) }
							>
								?
							</button>
							<button
								onClick={ clearChat }
								disabled={ workerStatus !== 'ready' }
								aria-label={ __( 'Clear Chat', 'hey-wapuu' ) }
								className="hw-clear-btn"
								title={ __( 'Clear Chat', 'hey-wapuu' ) }
							>
								{ __( 'Clear', 'hey-wapuu' ) }
							</button>
							<button
								onClick={ () => setIsOpen( false ) }
								aria-label={ __( 'Close Chat', 'hey-wapuu' ) }
								className="hw-close-btn"
							>
								×
							</button>
						</div>
					</div>

					{ workerStatus !== 'ready' && (
						<div
							className="hw-progress-container"
							title={ sprintf(
								/* translators: %d: progress percentage */
								__( 'Loading: %d%%', 'hey-wapuu' ),
								loadingProgress
							) }
						>
							<div
								className="hw-progress-bar"
								style={ { width: `${ loadingProgress }%` } }
							/>
						</div>
					) }

					<div
						className="hw-chat-content"
						ref={ scrollRef }
						role="log"
						aria-live="polite"
					>
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
							<div
								className="hw-bubble hw-bubble-ai hw-thinking"
								aria-busy="true"
							>
								<span className="screen-reader-text">
									{ __( 'Thinking...', 'hey-wapuu' ) }
								</span>
								<span>.</span>
								<span>.</span>
								<span>.</span>
							</div>
						) }
					</div>

					{ ( uiState === 'results' || matches.length > 0 ) && (
						<div className="hw-suggestions">
							{ matches.map( ( match ) => {
								const cmd = findCommand( match.id );
								return cmd ? (
									<button
										key={ match.id }
										className="hw-match-card"
										onClick={ () => {
											runCommand( match.id );
											setInput( '' );
										} }
									>
										<strong>
											{ sprintf(
												/* translators: %s: command label */
												__(
													'Go to %s',
													'hey-wapuu'
												),
												cmd.label
													.toLowerCase()
													.replace( '!', '' )
													.trim()
											) }
										</strong>
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
							disabled={ workerStatus !== 'ready' }
							aria-label={
								isListening
									? __( 'Stop Listening', 'hey-wapuu' )
									: __( 'Voice Input', 'hey-wapuu' )
							}
							title={ __( 'Voice Input', 'hey-wapuu' ) }
						>
							{ isListening ? '🛑' : '🎤' }
						</button>
						<input
							ref={ inputRef }
							type="text"
							disabled={ workerStatus !== 'ready' }
							placeholder={ inputPlaceholder }
							value={ input }
							onChange={ ( e ) => setInput( e.target.value ) }
							onKeyDown={ ( e ) =>
								e.key === 'Enter' && handleSend()
							}
							aria-label={ __( 'Chat message', 'hey-wapuu' ) }
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
		if ( document.getElementById( 'hey-wapuu-root' ) ) {
			return;
		}
		const rootElement = document.createElement( 'div' );
		rootElement.id = 'hey-wapuu-root';
		document.body.appendChild( rootElement );
		const root = createRoot( rootElement );
		root.render( <WapuuChatApp /> );
	}
};

if (
	document.readyState === 'complete' ||
	document.readyState === 'interactive'
) {
	init();
} else {
	document.addEventListener( 'DOMContentLoaded', init );
}
