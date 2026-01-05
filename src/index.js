/* global sessionStorage, Audio, Worker, ajaxurl, heyWapuuConfig */
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
const isSafeUrl = ( url ) => {
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

/**
 * Typewriter Effect Component (Enterprise smooth)
 *
 * @param {Object}   root0              Props object.
 * @param {string}   root0.text         The text to type.
 * @param {number}   [root0.speed=25]   Typing speed in ms.
 * @param {Function} [root0.onComplete] Callback when typing finishes.
 */
const TypewriterText = ( { text, speed = 25, onComplete } ) => {
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

/**
 * Action Card Component
 *
 * @param {Object}   root0          Props object.
 * @param {string}   root0.type     Type of card.
 * @param {Object}   root0.data     Data for the card.
 * @param {Function} root0.onAction Action callback.
 */
const ActionCard = ( { type, data, onAction } ) => {
	const icons = {
		drafts: '✍️',
		updates: '🔄',
		media: '🖼️',
		post: '📝',
	};

	const titles = {
		drafts: __( 'Continue Writing?', 'hey-wapuu' ),
		updates: __( 'Fresh Magic Available!', 'hey-wapuu' ),
		media: __( 'Treasure Chest Update', 'hey-wapuu' ),
		post: __( "What's Next?", 'hey-wapuu' ),
	};

	return (
		<div className="hw-action-card">
			<div className="hw-card-header">
				<span>{ icons[ type ] || '✨' }</span>
				<span>
					{ titles[ type ] || __( 'Wapuu Suggestion', 'hey-wapuu' ) }
				</span>
			</div>
			<div className="hw-card-body">{ data.message }</div>
			<div className="hw-card-footer">
				{ data.secondaryAction && (
					<button
						className="hw-card-btn is-secondary"
						onClick={ () => onAction( data.secondaryAction.id ) }
					>
						{ data.secondaryAction.label }
					</button>
				) }
				<button
					className="hw-card-btn"
					onClick={ () => onAction( data.primaryAction.id ) }
				>
					{ data.primaryAction.label }
				</button>
			</div>
		</div>
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
					"I see we're working on a story! Need help with the words? ✍️✨",
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
					"Managing our team of friends? I'm here to help! 👥✨",
					'hey-wapuu'
				),
			};
		}

		return {
			name: __( 'this magic page', 'hey-wapuu' ),
			nudge: __(
				"I'm all ready! What should we build together today? 🚀✨",
				'hey-wapuu'
			),
		};
	}, [ context ] );

	const [ isOpen, setIsOpen ] = useState( false );
	const [ input, setInput ] = useState( '' );
	const [ messages, setMessages ] = useState( () => {
		try {
			const saved = sessionStorage.getItem( 'hey_wapuu_history' );
			const parsed = saved ? JSON.parse( saved ) : [];
			// Mark old messages as already typed
			return parsed.map( ( m ) => ( { ...m, hasTyped: true } ) );
		} catch ( e ) {
			return [];
		}
	} );
	const [ matches, setMatches ] = useState( [] );
	const [ dynamicCommands, setDynamicCommands ] = useState( [] );
	const [ workerStatus, setWorkerStatus ] = useState( 'idle' );
	const [ loadingProgress, setLoadingProgress ] = useState( 0 );
	const [ isReadyNotification, setIsReadyNotification ] = useState( false );
	const [ isThinking, setIsThinking ] = useState( false );
	const [ isListening, setIsListening ] = useState( false );
	const [ wapuuMood, setWapuuMood ] = useState( 'happy' ); // happy, thinking, wiggle, celebrate
	const [ isGlowing, setIsGlowing ] = useState( false );
	const [ bootTime, setBootTime ] = useState( Date.now() );

	const workerRef = useRef( null );
	const scrollRef = useRef( null );
	const inputRef = useRef( null );
	const summonerRef = useRef( null );
	const chatWindowRef = useRef( null );
	const recognitionRef = useRef( null );
	const getScreenContextRef = useRef( getScreenContext );
	const debounceTimerRef = useRef( null );

	/**
	 * Watchdog: Detect if worker is stuck
	 */
	const isStuck =
		( workerStatus === 'initializing' || workerStatus === 'loading' ) &&
		Date.now() - bootTime > 15000;

	/**
	 * Force Restart
	 */
	const forceRestart = useCallback( () => {
		if ( workerRef.current ) {
			workerRef.current.terminate();
			workerRef.current = null;
		}
		setWorkerStatus( 'idle' );
		setBootTime( Date.now() );
	}, [] );

	/**
	 * Sidebar Scraper: Learn custom menu items
	 */
	useEffect( () => {
		const scrapeSidebar = () => {
			const menuItems = document.querySelectorAll(
				'#adminmenu a.wp-has-submenu, #adminmenu a.menu-top'
			);
			const learned = [];

			menuItems.forEach( ( item ) => {
				const label = item.innerText
					.replace( /\d+/g, '' )
					.replace( /<[^>]*>?/gm, '' )
					.trim();
				const url = item.getAttribute( 'href' );

				if (
					label &&
					url &&
					! learned.some( ( l ) => l.label === label )
				) {
					if ( isSafeUrl( url ) ) {
						learned.push( {
							id: `dynamic/${ url }`,
							label,
							url,
							explanation: sprintf(
								/* translators: %s: menu label */
								__( 'Open the %s page', 'hey-wapuu' ),
								label
							),
							isDynamic: true,
						} );
					}
				}
			} );

			// Check for changes before updating state to avoid re-renders
			setDynamicCommands( ( prev ) => {
				if ( JSON.stringify( prev ) === JSON.stringify( learned ) ) {
					return prev;
				}
				return learned;
			} );
		};

		if ( document.readyState === 'complete' ) {
			scrapeSidebar();
		} else {
			window.addEventListener( 'load', scrapeSidebar );
			return () => window.removeEventListener( 'load', scrapeSidebar );
		}
	}, [] );

	/**
	 * Send dynamic commands to worker
	 */
	useEffect( () => {
		if (
			workerStatus === 'ready' &&
			dynamicCommands.length > 0 &&
			workerRef.current
		) {
			workerRef.current.postMessage( {
				type: 'learn',
				data: { commands: dynamicCommands },
			} );
		}
	}, [ workerStatus, dynamicCommands ] );

	/**
	 * Live Search Logic
	 */
	useEffect( () => {
		if ( ! input.trim() || workerStatus !== 'ready' ) {
			if ( ! isThinking ) {
				setMatches( [] );
			}
			return;
		}

		// Debounce to save CPU/Battery
		if ( debounceTimerRef.current ) {
			clearTimeout( debounceTimerRef.current );
		}

		debounceTimerRef.current = setTimeout( () => {
			if ( workerRef.current ) {
				workerRef.current.postMessage( {
					type: 'query',
					data: {
						text: input,
						context: context.postType || context.screenId,
						dynamicCommands, // Pass the "learned" commands to the AI
					},
				} );
			}
		}, 250 );

		return () => clearTimeout( debounceTimerRef.current );
	}, [ input, workerStatus, dynamicCommands, context, isThinking ] );

	/**
	 * Launch Confetti Celebration
	 */
	const launchConfetti = useCallback( () => {
		const colors = [
			'#ffce00',
			'#007cba',
			'#ff4444',
			'#44ff44',
			'#ffffff',
		];
		const count = 40;
		const container = document.body;

		for ( let i = 0; i < count; i++ ) {
			const c = document.createElement( 'div' );
			c.className = 'hw-confetti';
			c.style.background =
				colors[ Math.floor( Math.random() * colors.length ) ];
			c.style.left = `${ Math.random() * 100 }vw`;
			c.style.top = '-10px';
			c.style.setProperty(
				'--tw-x',
				`${ ( Math.random() - 0.5 ) * 200 }px`
			);
			c.style.setProperty( '--tw-r', `${ Math.random() * 1000 }deg` );
			c.style.width = `${ 5 + Math.random() * 10 }px`;
			c.style.height = c.style.width;
			c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';

			container.appendChild( c );
			setTimeout( () => c.remove(), 3000 );
		}
	}, [] );

	// Update ref whenever getScreenContext changes
	useEffect( () => {
		getScreenContextRef.current = getScreenContext;
	}, [ getScreenContext ] );

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
			// Safely handle browser audio blocking
			const playPromise = audio.play();
			if ( playPromise !== undefined ) {
				playPromise.catch( () => {
					// Interaction required - fail silently
				} );
			}
		} catch ( e ) {
			// Fail silently
		}
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

			// REGEX FAST-PATH: Check for obvious matches before hitting the AI
			const fastMatch = searchFallback( messageText );
			const isExactMatch = fastMatch.some( ( m ) => {
				const cmd = commandRegistry.find( ( c ) => c.id === m.id );
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
									"I've got that right here for you, %s! ✨",
									'hey-wapuu'
								),
								user.firstName
							),
							hasTyped: false,
						},
					] );
				}, 50 ); // Near-instant response
				return;
			}

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
								hasTyped: false,
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
								hasTyped: false,
							},
						] );
					}
				}, 600 );
			}
		},
		[ input, workerStatus, context, triggerHaptic, user.firstName ]
	);

	/**
	 * Run matched command
	 */
	const runCommand = useCallback(
		( commandId ) => {
			// Find in registry OR dynamic commands
			const cmd =
				commandRegistry.find( ( c ) => c.id === commandId ) ||
				dynamicCommands.find( ( c ) => c.id === commandId );

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
			launchConfetti();

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
			dynamicCommands,
			launchConfetti,
		]
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
							{
								role: 'ai',
								text: arrivalMessage,
								hasTyped: false,
							},
						] );

						// Intent Chaining: Proactive follow-ups
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
												'Want some tips on writing great headlines?',
												'hey-wapuu'
											),
											primaryAction: {
												id: 'wapuu/show-tips',
												label: __(
													'Show Tips 💡',
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
						"%1$s, %2$s! 💛 I'm so happy to see you! What should we build on **%3$s** today? %4$s",
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
						'Hi %1$s! 👋 I was just thinking about **%2$s**. Want to make it even better together? %3$s',
						'hey-wapuu'
					),
					user.firstName,
					site.name,
					contextNote
				),
				sprintf(
					/* translators: 1: user first name, 2: site name, 3: contextual note */
					__(
						'Ooh, %1$s is here! 🌟 Ready to do some magic on **%2$s**? %3$s',
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
		site.name,
		site.draftCount,
		site.hasUpdates,
		site.mediaCount,
		site.pendingComments,
		user.firstName,
	] );

	// History and Audio sync
	useEffect( () => {
		if ( messages.length > 0 ) {
			sessionStorage.setItem(
				'hey_wapuu_history',
				JSON.stringify( messages.slice( -50 ) ) // Keep history lean for performance
			);
		}
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
			// Toggle with Alt+W (standard) or Ctrl+W (non-Mac)
			// Using e.code 'KeyW' is more robust for physical key mapping
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
				// Close on Escape
				if ( e.key === 'Escape' ) {
					setIsOpen( false );
					e.preventDefault();
					e.stopPropagation();
					summonerRef.current?.focus();
					return;
				}

				// Tab Trap
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
						e.stopPropagation();
					} else if ( ! e.shiftKey && activeElement === last ) {
						first.focus();
						e.preventDefault();
						e.stopPropagation();
					}
				}
			}
		};

		// Use capture phase (true) to ensure we catch these before other WP listeners
		window.addEventListener( 'keydown', handleKeyDown, true );
		return () =>
			window.removeEventListener( 'keydown', handleKeyDown, true );
	}, [ isOpen ] );

	// Auto-focus input when opened
	useEffect( () => {
		if ( isOpen ) {
			const timer = setTimeout( () => {
				inputRef.current?.focus();
			}, 100 );
			return () => clearTimeout( timer );
		}
	}, [ isOpen ] );

	/**
	 * Web Worker Lifecycle
	 */
	useEffect( () => {
		const channel =
			typeof window.BroadcastChannel !== 'undefined'
				? new BroadcastChannel( 'hey_wapuu_sync' )
				: null;

		let bootTimeout = null;

		const initWorker = () => {
			// eslint-disable-next-line no-console
			console.log( 'Wapuu Trace: Initializing Worker...' );

			if ( workerRef.current || ! window.Worker ) {
				return;
			}

			setWorkerStatus( 'initializing' );

			try {
				// Use the clean URL without query strings for better compatibility
				const workerUrl = heyWapuuConfig.workerUrl.split( '?' )[ 0 ];
				workerRef.current = new Worker( workerUrl, { type: 'module' } );

				workerRef.current.postMessage( {
					type: 'init',
					data: {
						embeddingsUrl: heyWapuuConfig.embeddingsUrl,
						modelUrl: heyWapuuConfig.modelUrl,
						version: heyWapuuConfig.version,
					},
				} );

				workerRef.current.onmessage = ( event ) => {
					const { type, data } = event.data;
					if ( type === 'status' ) {
						// eslint-disable-next-line no-console
						console.log(
							'Wapuu Trace: Worker Status ->',
							data.status
						);

						if ( data.status === 'ready' ) {
							setWorkerStatus( 'ready' );
							setLoadingProgress( 100 );
							setIsReadyNotification( true );
							setTimeout(
								() => setIsReadyNotification( false ),
								3000
							);
							channel?.postMessage( { type: 'ready' } );
						} else if ( data.status === 'loading' ) {
							setWorkerStatus( 'loading' );
						} else if ( data.status === 'downloading' ) {
							setWorkerStatus( 'downloading' );
							if ( data.percent ) {
								const val = parseInt( data.percent, 10 );
								if ( ! isNaN( val ) ) {
									setLoadingProgress( val );
									channel?.postMessage( {
										type: 'progress',
										percent: val,
									} );
								}
							}
						} else if ( data.status === 'error' ) {
							setWorkerStatus( 'error' );
						}
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
								hasTyped: false,
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
					}
				};

				workerRef.current.onerror = ( err ) => {
					// eslint-disable-next-line no-console
					console.error( 'Wapuu Trace: Worker Error ->', err );
					setWorkerStatus( 'error' );
				};
			} catch ( e ) {
				// eslint-disable-next-line no-console
				console.error( 'Wapuu Trace: Boot Exception ->', e );
				setWorkerStatus( 'error' );
			}
		};

		// Direct Boot if idle
		if ( workerStatus === 'idle' ) {
			bootTimeout = setTimeout( initWorker, 500 );
		}

		return () => {
			if ( bootTimeout ) {
				clearTimeout( bootTimeout );
			}
			if ( workerRef.current && workerStatus === 'error' ) {
				workerRef.current.terminate();
				workerRef.current = null;
			}
			channel?.close();
		};
	}, [ workerStatus ] );

	// Proactive suggestions based on context
	useEffect( () => {
		if (
			workerStatus === 'ready' &&
			messages.length === 1 &&
			messages[ 0 ].isInitial
		) {
			// Add a proactive card based on site state
			setTimeout( () => {
				if ( site.draftCount > 0 ) {
					setMessages( ( prev ) => [
						...prev,
						{
							role: 'ai',
							type: 'card',
							cardType: 'drafts',
							hasTyped: true, // Cards don't typewriter
							data: {
								message: sprintf(
									/* translators: %d: draft count */
									__(
										'I see we have %d stories in progress. Want to pick one up where we left off?',
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
									"There's new magic available for our site! Should we check out the updates?",
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
									'Our story library is empty! 📖 Want to start our very first magic adventure?',
									'hey-wapuu'
								),
								primaryAction: {
									id: 'core/add-new-post',
									label: __( 'Start Story', 'hey-wapuu' ),
								},
							},
						},
					] );
				}
			}, 2000 );
		}
	}, [
		workerStatus,
		messages,
		site.draftCount,
		site.hasUpdates,
		site.postCount,
	] );

	// Auto-scroll
	useEffect( () => {
		if ( scrollRef.current ) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [ messages, isThinking ] );

	// Glow effect based on mood
	useEffect( () => {
		if ( wapuuMood === 'thinking' || wapuuMood === 'celebrate' ) {
			setIsGlowing( true );
		} else {
			setIsGlowing( false );
		}
	}, [ wapuuMood ] );

	const summonerClassName = [
		'hw-summoner',
		isOpen ? 'is-active' : '',
		isReadyNotification ? 'is-ready-notification' : '',
		`mood-${ wapuuMood }`,
	]
		.filter( Boolean )
		.join( ' ' );

	let inputPlaceholder = __( 'Talk to me…', 'hey-wapuu' );
	if ( workerStatus !== 'ready' ) {
		inputPlaceholder = __( 'Wapuu is reading…', 'hey-wapuu' );
		if ( isStuck ) {
			inputPlaceholder = __( 'Wapuu is stuck! Click to wake up…', 'hey-wapuu' );
		}
	} else if ( isListening ) {
		inputPlaceholder = __( "I'm listening…", 'hey-wapuu' );
	}

	return (
		<>
			<button
				ref={ summonerRef }
				className={ summonerClassName }
				onClick={ () => {
					if ( isStuck ) {
						forceRestart();
					} else {
						setIsOpen( ! isOpen );
					}
				} }
				aria-expanded={ isOpen }
				aria-haspopup="dialog"
				aria-label={
					isOpen
						? __( 'Close Wapuu Chat', 'hey-wapuu' )
						: __( 'Open Wapuu Chat', 'hey-wapuu' )
				}
			>
				{ isStuck ? '🔄' : isOpen ? '×' : seasonalIcon }
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
								? __( 'Wake up, Wapuu!', 'hey-wapuu' )
								: sprintf(
										/* translators: %s: user first name */
										__( 'Hey %s! 💛', 'hey-wapuu' ),
										user.firstName
								  ) }
						</h2>
						<div className="hw-header-actions">
							{ isStuck && (
								<button
									onClick={ forceRestart }
									className="hw-wake-btn"
									title={ __( 'Force Restart AI', 'hey-wapuu' ) }
								>
									{ __( 'Wake Up', 'hey-wapuu' ) }
								</button>
							) }
							<button
								onClick={ () => handleSpecialAction( 'help' ) }
								disabled={ workerStatus !== 'ready' }
								aria-label={ __( 'Help', 'hey-wapuu' ) }
								className="hw-help-btn"
								title={ __( 'What can I do?', 'hey-wapuu' ) }
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
									const cmd =
										commandRegistry.find(
											( c ) => c.id === match.id
										) ||
										dynamicCommands.find(
											( c ) => c.id === match.id
										);
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
									: __( 'Talk to Wapuu', 'hey-wapuu' )
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
