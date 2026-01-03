/* global sessionStorage, Audio, Worker, ajaxurl, heyWapuuConfig */
/* eslint-disable no-alert */
import {
	render,
	useState,
	useEffect,
	useRef,
	useCallback,
	useMemo,
} from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { commands as commandRegistry } from './commands.js';
import { searchFallback } from './fallback.js';
import './style.css';

/**
 * Robust Sanitizer Helper
 *
 * @param {string} str The string to sanitize.
 */
const sanitize = ( str ) => {
	if ( ! str || typeof str !== 'string' ) {
		return '';
	}
	return str.replace(
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
};

/**
 * Hey Wapuu Chat App - The "Regionally Famous" Edition
 */
const WapuuChatApp = () => {
	const config = window.heyWapuuConfig || {};

	// Memoize static data
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
		} ),
		[
			config.site?.name,
			config.site?.draftCount,
			config.site?.pendingComments,
			config.site?.mediaCount,
			config.site?.hasUpdates,
			config.site?.activePlugins,
		]
	);

	const context = useMemo( () => config.context || {}, [ config.context ] );

	/**
	 * Get a friendly, contextual message based on the current screen.
	 */
	const getScreenContext = useCallback( () => {
		const screenId = context.screenId || '';
		const isEditing = !! context.isEditing;

		if ( screenId === 'site-editor' ) {
			return {
				name: __( 'the workshop', 'hey-wapuu' ),
				nudge: __(
					'Ready to change how our site looks? 🛠️✨',
					'hey-wapuu'
				),
			};
		}

		if ( isEditing ) {
			return {
				name: __( 'this adventure', 'hey-wapuu' ),
				nudge: __(
					'I see we\'re working on a story! Need help with the words? ✍️✨',
					'hey-wapuu'
				),
			};
		}

		if ( screenId === 'plugins' ) {
			return {
				name: __( 'the superpower lab', 'hey-wapuu' ),
				nudge: __(
					'Looking for new superpowers? I can help you find the best ones! 🦸‍♂️✨',
					'hey-wapuu'
				),
			};
		}

		if ( screenId === 'upload' ) {
			return {
				name: __( 'the treasure chest', 'hey-wapuu' ),
				nudge: __(
					'Looking for a hidden gem in our pictures? 🖼️✨',
					'hey-wapuu'
				),
			};
		}

		if ( screenId === 'dashboard' ) {
			return {
				name: __( 'headquarters', 'hey-wapuu' ),
				nudge: __(
					"Welcome back! Everything looks great on our site's map! 🗺️✨",
					'hey-wapuu'
				),
			};
		}

		if ( screenId === 'themes' ) {
			return {
				name: __( 'the wardrobe', 'hey-wapuu' ),
				nudge: __(
					"Checking out our site's clothes? I love our current outfit! 👗✨",
					'hey-wapuu'
				),
			};
		}

		if ( screenId === 'users' ) {
			return {
				name: __( 'the team house', 'hey-wapuu' ),
				nudge: __(
					'Managing our team of friends? I\'m here to help! 👥✨',
					'hey-wapuu'
				),
			};
		}

		return {
			name: __( 'this magic page', 'hey-wapuu' ),
			nudge: __(
				'I\'m all ready! What should we build together today? 🚀✨',
				'hey-wapuu'
			),
		};
	}, [ context ] );

	const [ isOpen, setIsOpen ] = useState( false );
	const [ input, setInput ] = useState( '' );
	const [ messages, setMessages ] = useState( () => {
		try {
			const saved = sessionStorage.getItem( 'hey_wapuu_history' );
			return saved ? JSON.parse( saved ) : [];
		} catch ( e ) {
			return [];
		}
	} );
	const [ matches, setMatches ] = useState( [] );
	const [ workerStatus, setWorkerStatus ] = useState( 'idle' );
	const [ isThinking, setIsThinking ] = useState( false );
	const [ isListening, setIsListening ] = useState( false );
	const [ wapuuMood, setWapuuMood ] = useState( 'happy' ); // happy, thinking, wiggle, celebrate

	const workerRef = useRef( null );
	const scrollRef = useRef( null );
	const inputRef = useRef( null );
	const summonerRef = useRef( null );
	const chatWindowRef = useRef( null );
	const recognitionRef = useRef( null );

	const { executeCommand } = useDispatch( 'core/commands' );
	const allRegisteredCommands = useSelect(
		( select ) => select( 'core/commands' ).getCommands(),
		[]
	);

	/**
	 * Seasonal Icon Logic
	 */
	const seasonalIcon = useMemo( () => {
		const month = new Date().getMonth();
		if ( month === 11 ) {
			return '🎄';
		} // December
		if ( month === 9 ) {
			return '🎃';
		} // October
		if ( month === 1 ) {
			return '💖';
		} // February
		return '💬';
	}, [] );

	/**
	 * Subtle audio feedback
	 */
	const playPop = useCallback( () => {
		try {
			const audio = new Audio(
				'https://s3.amazonaws.com/freecodecamp/drums/Give_us_a_light.mp3'
			);
			audio.volume = 0.05;
			audio.play();
		} catch ( e ) {}
	}, [] );

	/**
	 * Subtle haptic feedback
	 */
	const triggerHaptic = useCallback( () => {
		if (
			typeof window !== 'undefined' &&
			window.navigator &&
			window.navigator.vibrate
		) {
			window.navigator.vibrate( 10 );
		}
	}, [] );

	/**
	 * Handle Special Actions
	 */
	const handleSpecialAction = useCallback(
		( action ) => {
			const actions = {
				joke: () => {
					const jokes = [
						__(
							'Why did the WordPress developer go broke? Because he kept giving out all his themes for free! 😂',
							'hey-wapuu'
						),
						__(
							"What is a WordPress developer's favorite drink? Root beer! 🍺",
							'hey-wapuu'
						),
						__(
							"How many WordPress developers does it take to change a lightbulb? Just one, but they'll need to install 20 plugins first! 💡",
							'hey-wapuu'
						),
						__(
							'Why was the WordPress site so good at baseball? Because it had a great pitch! ⚾',
							'hey-wapuu'
						),
						__(
							'What did the server say to the plugin? "You\'re really starting to get on my nerves!" 🔌',
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
								'I was born in Tokyo, Japan! 🇯🇵 I\'m a mythical creature called a "Kappa". I love WordPress and I love making friends with builders like you! 💛✨',
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
								'🎶 Oh, WordPress is the place to be, building worlds for you and me! With a block here and a block there, we make magic everywhere! 🎶 💛✨',
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
								'I have a super-big brain (about 22 megabytes of WordPress knowledge!) and I just need a few seconds to load it all up so I can understand you perfectly! 🧠✨',
								'hey-wapuu'
							),
						},
					] );
				},
				tips: () => {
					const buildTips = [
						__(
							'Always start with a great title for your story! ✍️',
							'hey-wapuu'
						),
						__(
							"Don't forget to add some cool pictures to your treasure chest! 🖼️",
							'hey-wapuu'
						),
						__(
							'The site editor is like a master workshop—try changing the colors! 🎨',
							'hey-wapuu'
						),
						__(
							'Adding a new page is like building a whole new room in your house! 🏠',
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
									'I can help you build pages, share stories, find pictures, or even tell you a joke! 🪄 Just ask me things like:',
									'hey-wapuu'
								) +
								'\n\n• "Create a new post"\n• "Show me my images"\n• "Change our site colors"\n• "Tell me a joke"\n\n' +
								__(
									"I'm a super-fast learner! 🚀✨",
									'hey-wapuu'
								),
						},
					] );
					setMatches( [
						{ id: 'core/add-new-post', score: 0.1 },
						{ id: 'core/open-media-library', score: 0.1 },
						{ id: 'core/open-styles', score: 0.1 },
						{ id: 'wapuu/tell-joke', score: 0.1 },
					] );
				},
				status: () => {
					let statusText = sprintf(
						/* translators: 1: theme name, 2: active plugins count */
						__(
							"Our site is looking great! We're wearing the **%1$s** outfit and using **%2$d** superpowers! 🦸‍♂️✨",
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
									'We also have %d friends waiting for a reply! Should we go say hi? 💬',
									'hey-wapuu'
								),
								site.pendingComments
							);
					}

					if ( site.hasUpdates ) {
						statusText +=
							'\n\n' +
							__(
								"And look! There's some fresh magic available in our updates! 🔄✨",
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
		[
			site.activePlugins,
			site.pendingComments,
			site.hasUpdates,
			config.site?.themeName,
		]
	);

	/**
	 * Send message logic
	 */
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
			setMatches( [] );
			setIsThinking( true );
			setWapuuMood( 'thinking' );

			if ( workerStatus === 'ready' && workerRef.current ) {
				workerRef.current.postMessage( {
					type: 'query',
					data: {
						text: messageText,
						context: context.postType || context.screenId,
					},
				} );
			} else {
				// Fallback if worker isn't ready
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
									"I'm still opening my big book of magic, but I think you might mean one of these! 📖✨",
									'hey-wapuu'
								),
							},
						] );
					} else {
						setMessages( ( prev ) => [
							...prev,
							{
								role: 'ai',
								text: __(
									"Wait for it… I'm still reading my notes! Once I'm done, I can help you with almost anything! 📚💛",
									'hey-wapuu'
								),
							},
						] );
					}
				}, 600 );
			}
		},
		[ input, workerStatus, context, triggerHaptic ]
	);

	/**
	 * Run matched command
	 */
	const runCommand = useCallback(
		( commandId ) => {
			const cmd = commandRegistry.find( ( c ) => c.id === commandId );
			if ( ! cmd ) {
				return;
			}

			if ( cmd.action ) {
				handleSpecialAction( cmd.action );
				return;
			}

			setMessages( ( prev ) => [
				...prev,
				{
					role: 'ai',
					text: __(
						'Zooming to our destination in 3… 2… 1… 🏎️💨',
						'hey-wapuu'
					),
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
		[ allRegisteredCommands, executeCommand, handleSpecialAction ]
	);

	/**
	 * Voice Toggle
	 */
	const toggleListening = useCallback( () => {
		triggerHaptic();
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
	}, [ isListening, triggerHaptic ] );

	/**
	 * Clear Chat
	 */
	const clearChat = useCallback( () => {
		if (
			window.confirm(
				__(
					'Are you sure you want to clear our chat history? 🧹',
					'hey-wapuu'
				)
			)
		) {
			setMessages( [] );
			sessionStorage.removeItem( 'hey_wapuu_history' );
			window.location.reload();
		}
	}, [] );

	// Initialize Speech Recognition
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
				setInput( transcript );
				setIsListening( false );
				setTimeout( () => handleSend( transcript ), 500 );
			};

			recognitionRef.current.onerror = () => setIsListening( false );
			recognitionRef.current.onend = () => setIsListening( false );
		}
		return () => {
			if ( recognitionRef.current ) {
				recognitionRef.current.stop();
			}
		};
	}, [ handleSend ] );

	// Persistence & Arrival Awareness
	useEffect( () => {
		const arrivalData = sessionStorage.getItem( 'hey_wapuu_arrival' );
		if ( arrivalData ) {
			try {
				const { id, label, time } = JSON.parse( arrivalData );
				if ( Date.now() - time < 60000 ) {
					const cleanLabel = label
						.replace(
							/✍️|🏠|📝|🖼️|📤|👗|🛠️|🗺️|👥|➕|💬|🦸‍♂️|🏷️|🖐️|🌍|😂|💛/g,
							''
						)
						.trim();

					// Page-specific contextual arrival messages
					let arrivalMessage = sprintf(
						/* translators: %s: destination label */
						__(
							"We made it! 🚀 We're at our destination: **%s**! Ready to start some magic? ✨",
							'hey-wapuu'
						),
						cleanLabel
					);

					if ( id === 'core/add-new-post' ) {
						arrivalMessage = __(
							'We made it! ✍️ This is where we write our magic adventures. Tell me what you want to write about!',
							'hey-wapuu'
						);
					} else if ( id === 'core/open-media-library' ) {
						arrivalMessage = __(
							'Ooh, look at all these treasures! 🖼️ Want to add something new or find a specific picture?',
							'hey-wapuu'
						);
					} else if ( id === 'core/open-site-editor' ) {
						arrivalMessage = __(
							"We're in the workshop! 🛠️ This is where the big magic happens. What should we change first?",
							'hey-wapuu'
						);
					}

					setTimeout( () => {
						setMessages( ( prev ) => [
							...prev,
							{ role: 'ai', text: arrivalMessage },
						] );
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
						"%1$s, %2$s! 💛 I'm so happy to see you! What should we build on **%3$s** today?%4$s",
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
						'Hi %1$s! 👋 I was just thinking about **%2$s**. Want to make it even better together?%3$s',
						'hey-wapuu'
					),
					user.firstName,
					site.name,
					contextNote
				),
				sprintf(
					/* translators: 1: user first name, 2: site name, 3: contextual note */
					__(
						'Ooh, %1$s is here! 🌟 Ready to do some magic on **%2$s**?%3$s',
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
						__(
							'I saw we have %d stories waiting for us! 📖',
							'hey-wapuu'
						),
						site.draftCount
					);
			}

			if ( site.pendingComments > 0 ) {
				welcomeText +=
					' ' +
					sprintf(
						/* translators: %d: number of pending comments */
						__(
							'And ooh, %d friends left us new messages! 💬',
							'hey-wapuu'
						),
						site.pendingComments
					);
			}

			if ( site.hasUpdates ) {
				welcomeText +=
					' ' +
					__(
						"Psst… I think there's some new magic waiting for us in the updates! 🔄✨",
						'hey-wapuu'
					);
			}

			if ( site.mediaCount > 50 && Math.random() > 0.7 ) {
				welcomeText +=
					' ' +
					sprintf(
						/* translators: %d: number of media items */
						__(
							'Wow, our treasure chest is getting so big with %d treasures! 🖼️💎',
							'hey-wapuu'
						),
						site.mediaCount
					);
			}

			setTimeout(
				() =>
					setMessages( [
						{ role: 'ai', text: welcomeText, isInitial: true },
					] ),
				300
			);
		}
	}, [
		messages.length,
		context,
		site.name,
		site.draftCount,
		site.hasUpdates,
		site.mediaCount,
		site.pendingComments,
		user.firstName,
	] );

	// History and Audio sync
	useEffect( () => {
		sessionStorage.setItem(
			'hey_wapuu_history',
			JSON.stringify( messages )
		);
		if (
			messages.length > 0 &&
			messages[ messages.length - 1 ].role === 'ai'
		) {
			playPop();
		}
	}, [ messages, playPop ] );

	// Global Keyboard Listeners
	useEffect( () => {
		const handleKeyDown = ( e ) => {
			if ( e.altKey && e.key.toLowerCase() === 'w' ) {
				setIsOpen( ( prev ) => ! prev );
				e.preventDefault();
			}
			if ( e.key === 'Escape' ) {
				setIsOpen( false );
				summonerRef.current?.focus();
			}
			// Tab Trap
			if ( isOpen && e.key === 'Tab' && chatWindowRef.current ) {
				const focusable =
					chatWindowRef.current.querySelectorAll( 'button, input' );
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
		};
		window.addEventListener( 'keydown', handleKeyDown );
		if ( isOpen ) {
			setTimeout( () => inputRef.current?.focus(), 50 );
		}
		return () => window.removeEventListener( 'keydown', handleKeyDown );
	}, [ isOpen ] );

	// Web Worker Lifecycle
	useEffect( () => {
		if ( isOpen && workerStatus === 'idle' && window.Worker ) {
			setWorkerStatus( 'initializing' );
			workerRef.current = new Worker( heyWapuuConfig.workerUrl );
			workerRef.current.postMessage( {
				type: 'init',
				data: {
					embeddingsUrl: heyWapuuConfig.embeddingsUrl,
					modelUrl: heyWapuuConfig.modelUrl,
				},
			} );

			workerRef.current.onmessage = ( event ) => {
				const { type, data } = event.data;
				if ( type === 'status' ) {
					let translatedMessage = data.message;

					if ( data.status === 'ready' ) {
						setWorkerStatus( 'ready' );
						const screenContext = getScreenContext();
						translatedMessage = sprintf(
							/* translators: %s: screen name */
							__(
								"I've finished reading my notes! 📚 Now that we're at **%s**, I'm ready for anything! 🚀✨",
								'hey-wapuu'
							),
							screenContext.name
						);
					} else if ( data.status === 'loading' ) {
						translatedMessage = __(
							"I'm opening my big book of WordPress magic! 📖✨",
							'hey-wapuu'
						);
					} else if ( data.status === 'downloading' ) {
						translatedMessage = sprintf(
							/* translators: %s: percentage or size */
							__(
								"I'm reading my notes! %s ready! 📚✨",
								'hey-wapuu'
							),
							data.percent || ''
						);
					} else if ( data.status === 'error' ) {
						translatedMessage = __(
							'Oopsie! My brain had a little hiccup. Can we try again? 🙃',
							'hey-wapuu'
						);
					}

					setMessages( ( prev ) => {
						const newMsgs = [ ...prev ];
						if (
							newMsgs.length > 0 &&
							newMsgs[ newMsgs.length - 1 ].isStatus
						) {
							newMsgs[ newMsgs.length - 1 ] = {
								role: 'ai',
								text: translatedMessage,
								isStatus: true,
							};
							return newMsgs;
						}
						return [
							...prev,
							{
								role: 'ai',
								text: translatedMessage,
								isStatus: true,
							},
						];
					} );
				} else if ( type === 'error' ) {
					setIsThinking( false );
					setMessages( ( prev ) => [
						...prev,
						{
							role: 'ai',
							text: __(
								"I got a bit confused by that one! Maybe try saying it a different way? I'm still learning! 🤔",
								'hey-wapuu'
							),
						},
					] );
				} else if ( type === 'results' ) {
					setIsThinking( false );
					setWapuuMood( 'wiggle' );
					setMatches( data.matches );

					const topMatch =
						data.matches.length > 0
							? commandRegistry.find(
									( c ) => c.id === data.matches[ 0 ].id
							  )
							: null;
					let reply;

					if ( topMatch ) {
						const rand = Math.floor( Math.random() * 4 );
						if ( rand === 0 ) {
							reply = sprintf(
								/* translators: 1: user first name, 2: command explanation */
								__(
									'I can totally help with that, %1$s! %2$s ✨',
									'hey-wapuu'
								),
								user.firstName,
								topMatch.explanation
							);
						} else if ( rand === 1 ) {
								reply = sprintf(
									/* translators: %s: user first name */
									__( 'You got it, %s 🚀', 'hey-wapuu' ),
									user.firstName
								);
						} else if ( rand === 2 ) {
							reply = sprintf(
								/* translators: 1: user first name, 2: command explanation */
								__(
									'Ooh, I know exactly where that is, %1$s! %2$s 💛',
									'hey-wapuu'
								),
								user.firstName,
								topMatch.explanation
							);
						} else {
							reply = sprintf(
								/* translators: 1: user first name, 2: command explanation */
								__(
									'That sounds like a great idea, %1$s! %2$s 🌟',
									'hey-wapuu'
								),
								user.firstName,
								topMatch.explanation
							);
						}
					} else {
						const rand = Math.floor( Math.random() * 4 );
						if ( rand === 0 ) {
							reply = __(
								"Hmm, I don't know that magic trick yet! 🎩 But I'm a super-fast learner. Try asking me to start a story or open the treasure chest!",
								'hey-wapuu'
							);
						} else if ( rand === 1 ) {
							reply = __(
								"Whoopsie! My big book of WordPress magic doesn't have that page yet. 📖 Can we try one of these common spells instead?",
								'hey-wapuu'
							);
						} else if ( rand === 2 ) {
							reply = sprintf(
								/* translators: %s: user first name */
								__(
									"I'm not quite sure how to do that, %s! 🙃 I'm still just a young Wapuu. Should we try one of these instead?",
									'hey-wapuu'
								),
								user.firstName
							);
						} else {
							reply = __(
								"Ooh, that's a new one! 🌟 I haven't learned that magic yet. Want to see what I *can* do?",
								'hey-wapuu'
							);
						}

						// If no match, provide some fallback suggestions anyway
						setMatches( [
							{ id: 'core/add-new-post', score: 0.1 },
							{ id: 'core/open-media-library', score: 0.1 },
							{ id: 'wapuu/tell-joke', score: 0.1 },
						] );
					}

					setMessages( ( prev ) => [
						...prev,
						{ role: 'ai', text: reply },
					] );
					setTimeout( () => setWapuuMood( 'happy' ), 1500 );
				}
			};
		}
	}, [ isOpen, workerStatus, user.firstName ] );

	// Auto-scroll
	useEffect( () => {
		if ( scrollRef.current ) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [ messages, isThinking ] );

	return (
		<>
			<button
				ref={ summonerRef }
				className={ `hw-summoner ${
					isOpen ? 'is-active' : ''
				} mood-${ wapuuMood }` }
				onClick={ () => setIsOpen( ! isOpen ) }
				aria-expanded={ isOpen }
				aria-haspopup="dialog"
				aria-label={
					isOpen
						? __( 'Close Wapuu Chat', 'hey-wapuu' )
						: __( 'Open Wapuu Chat', 'hey-wapuu' )
				}
			>
				{ isOpen ? '×' : seasonalIcon }
			</button>

			{ isOpen && (
				<div
					className="hw-chat-window"
					role="dialog"
					aria-modal="true"
					aria-label={ __( 'Wapuu Assistant', 'hey-wapuu' ) }
					ref={ chatWindowRef }
				>
					<div className="hw-chat-header">
						<h2 id="hw-chat-title">
							{ sprintf(
								/* translators: %s: user first name */
								__( 'Hey %s! 💛', 'hey-wapuu' ),
								user.firstName
							) }
						</h2>
						<div className="hw-header-actions">
							<button
								onClick={ () => handleSpecialAction( 'help' ) }
								aria-label={ __( 'Help', 'hey-wapuu' ) }
								className="hw-help-btn"
								title={ __( 'What can I do?', 'hey-wapuu' ) }
							>
								?
							</button>
							<button
								onClick={ clearChat }
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

					<div
						className="hw-chat-content"
						ref={ scrollRef }
						role="log"
						aria-live="polite"
					>
						{ messages.map( ( msg, i ) => (
							<div
								key={ i }
								className={ `hw-bubble hw-bubble-${ msg.role }` }
							>
								<span
									dangerouslySetInnerHTML={ {
										__html: sanitize( msg.text ).replace(
											/\*\*(.*?)\*\*/g,
											'<strong>$1</strong>'
										),
									} }
								/>
							</div>
						) ) }
						{ isThinking && (
							<div
								className="hw-bubble hw-bubble-ai hw-thinking"
								aria-busy="true"
							>
								<span className="screen-reader-text">
									{ __( 'Wapuu is thinking…', 'hey-wapuu' ) }
								</span>
								<span>.</span>
								<span>.</span>
								<span>.</span>
							</div>
						) }
						{ matches.length > 0 && (
							<div className="hw-suggestions">
								{ matches.map( ( match ) => {
									const cmd = commandRegistry.find(
										( c ) => c.id === match.id
									);
									return cmd ? (
										<button
											key={ match.id }
											className="hw-match-card"
											onClick={ () =>
												runCommand( match.id )
											}
										>
											<strong>
												{ sprintf(
													/* translators: %s: command label */
													__(
														"Yes, let's %s 🚀",
														'hey-wapuu'
													),
													cmd.label
														.toLowerCase()
														.replace( '!', '' )
														.replace(
															/✍️|🏠|📝|🖼️|📤|👗|🛠️|🗺️|👥|➕|💬|🦸‍♂️|🏷️|🖐️|🌍|😂|💛/g,
															''
														)
														.trim()
												) }
											</strong>
											<span>{ cmd.explanation }</span>
										</button>
									) : null;
								} ) }
							</div>
						) }
					</div>

					<div className="hw-input-area">
						<button
							className={ `hw-mic-btn ${
								isListening ? 'is-listening' : ''
							}` }
							onClick={ toggleListening }
							aria-label={
								isListening
									? __( 'Stop Listening', 'hey-wapuu' )
									: __( 'Talk to Wapuu', 'hey-wapuu' )
							}
							title={ __( 'Voice Input', 'hey-wapuu' ) }
						>
							{ isListening ? '🛑' : '🎤' }
						</button>
						<input
							ref={ inputRef }
							type="text"
							placeholder={
								isListening
									? __( "I'm listening…", 'hey-wapuu' )
									: __( 'Talk to me…', 'hey-wapuu' )
							}
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
		const root = document.createElement( 'div' );
		root.id = 'hey-wapuu-root';
		document.body.appendChild( root );
		render( <WapuuChatApp />, root );
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
