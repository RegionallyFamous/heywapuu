import { render, useState, useEffect, useRef, useCallback, useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { commands as commandRegistry } from './commands.js';
import { searchFallback } from './fallback.js';
import './style.css';

/**
 * Robust Sanitizer Helper
 */
const sanitize = (str) => {
	if (!str || typeof str !== 'string') return '';
	return str.replace(/[&<>"']/g, (m) => ({
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;'
	}[m]));
};

/**
 * Hey Wapuu Chat App - The "Regionally Famous" Edition
 */
const WapuuChatApp = () => {
	const config = window.heyWapuuConfig || {};
	
	// Memoize static data
	const user = useMemo(() => ({
		firstName: sanitize(config.user?.firstName || __('Friend', 'hey-wapuu')),
	}), [config.user?.firstName]);

	const site = useMemo(() => ({
		name: sanitize(config.site?.name || __('your site', 'hey-wapuu')),
		draftCount: parseInt(config.site?.draftCount || 0, 10),
	}), [config.site?.name, config.site?.draftCount]);

	const context = useMemo(() => config.context || {}, [config.context]);

	const [isOpen, setIsOpen] = useState(false);
	const [input, setInput] = useState('');
	const [messages, setMessages] = useState(() => {
		try {
			const saved = sessionStorage.getItem('hey_wapuu_history');
			return saved ? JSON.parse(saved) : [];
		} catch (e) { return []; }
	});
	const [matches, setMatches] = useState([]);
	const [workerStatus, setWorkerStatus] = useState('idle');
	const [isThinking, setIsThinking] = useState(false);
	const [isListening, setIsListening] = useState(false);
	const [wapuuMood, setWapuuMood] = useState('happy'); // happy, thinking, wiggle, celebrate
	
	const workerRef = useRef(null);
	const scrollRef = useRef(null);
	const inputRef = useRef(null);
	const summonerRef = useRef(null);
	const chatWindowRef = useRef(null);
	const recognitionRef = useRef(null);

	const { executeCommand } = useDispatch('core/commands');
	const allRegisteredCommands = useSelect((select) => select('core/commands').getCommands(), []);

	/**
	 * Subtle audio feedback
	 */
	const playPop = useCallback(() => {
		try {
			const audio = new Audio('https://s3.amazonaws.com/freecodecamp/drums/Give_us_a_light.mp3');
			audio.volume = 0.05;
			audio.play();
		} catch (e) {}
	}, []);

	/**
	 * Subtle haptic feedback
	 */
	const triggerHaptic = useCallback(() => {
		if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
			window.navigator.vibrate(10);
		}
	}, []);

	/**
	 * Handle Special Actions
	 */
	const handleSpecialAction = useCallback((action) => {
		const actions = {
			joke: () => {
				const jokes = [
					__('Why did the WordPress developer go broke? Because he kept giving out all his themes for free! 😂', 'hey-wapuu'),
					__('What is a WordPress developer\'s favorite drink? Root beer! 🍺', 'hey-wapuu'),
					__('How many WordPress developers does it take to change a lightbulb? Just one, but they\'ll need to install 20 plugins first! 💡', 'hey-wapuu'),
					__('Why was the WordPress site so good at baseball? Because it had a great pitch! ⚾', 'hey-wapuu'),
					__('What did the server say to the plugin? "You\'re really starting to get on my nerves!" 🔌', 'hey-wapuu')
				];
				setMessages(prev => [...prev, { role: 'ai', text: jokes[Math.floor(Math.random() * jokes.length)] }]);
			},
			about: () => {
				setMessages(prev => [...prev, { role: 'ai', text: __('I was born in Tokyo, Japan! 🇯🇵 I\'m a mythical creature called a "Kappa". I love WordPress and I love making friends with builders like you! 💛✨', 'hey-wapuu') }]);
			},
			song: () => {
				setMessages(prev => [...prev, { role: 'ai', text: __('🎶 Oh, WordPress is the place to be, building worlds for you and me! With a block here and a block there, we make magic everywhere! 🎶 💛✨', 'hey-wapuu') }]);
			},
			why: () => {
				setMessages(prev => [...prev, { role: 'ai', text: __('I have a super-big brain (about 22 megabytes of WordPress knowledge!) and I just need a few seconds to load it all up so I can understand you perfectly! 🧠✨', 'hey-wapuu') }]);
			}
		};
		if (actions[action]) actions[action]();
	}, []);

	/**
	 * Send message logic
	 */
	const handleSend = useCallback((overrideInput) => {
		const messageText = (overrideInput || input).trim();
		if (!messageText) return;

		triggerHaptic();
		setMessages(prev => [...prev, { role: 'user', text: messageText }]);
		if (!overrideInput) setInput('');
		setMatches([]);
		setIsThinking(true);
		setWapuuMood('thinking');

		if (workerStatus === 'ready' && workerRef.current) {
			workerRef.current.postMessage({ 
				type: 'query', 
				data: { text: messageText, context: context.postType || context.screenId } 
			});
		} else {
			// Fallback if worker isn't ready
			setTimeout(() => {
				const fallback = searchFallback(messageText);
				setIsThinking(false);
				setWapuuMood('happy');
				setMatches(fallback);
				setMessages(prev => [...prev, { role: 'ai', text: __('I\'m still warming up my brain, but I think you might mean one of these! 💛', 'hey-wapuu') }]);
			}, 600);
		}
	}, [input, workerStatus, context, triggerHaptic]);

	/**
	 * Run matched command
	 */
	const runCommand = useCallback((commandId) => {
		const cmd = commandRegistry.find(c => c.id === commandId);
		if (!cmd) return;

		if (cmd.action) {
			handleSpecialAction(cmd.action);
			return;
		}

		setMessages(prev => [...prev, { role: 'ai', text: __('Zooming to our destination in 3... 2... 1... 🏎️💨', 'hey-wapuu') }]);
		setWapuuMood('celebrate');
		
		sessionStorage.setItem('hey_wapuu_arrival', JSON.stringify({
			label: cmd.label,
			time: Date.now()
		}));

		setTimeout(() => {
			const isRegistered = allRegisteredCommands.some(c => c.name === commandId);
			if (isRegistered) {
				executeCommand(commandId);
				setIsOpen(false);
			} else if (cmd.url) {
				const baseUrl = typeof ajaxurl !== 'undefined' ? ajaxurl.replace('admin-ajax.php', '') : '/wp-admin/';
				window.location.href = cmd.url.startsWith('/') ? cmd.url : baseUrl + cmd.url;
			}
		}, 800);
	}, [allRegisteredCommands, executeCommand, handleSpecialAction]);

	/**
	 * Voice Toggle
	 */
	const toggleListening = useCallback(() => {
		triggerHaptic();
		if (isListening) {
			recognitionRef.current?.stop();
		} else {
			try {
				setIsListening(true);
				recognitionRef.current?.start();
			} catch (e) {
				setIsListening(false);
			}
		}
	}, [isListening, triggerHaptic]);

	/**
	 * Clear Chat
	 */
	const clearChat = useCallback(() => {
		if (window.confirm(__('Are you sure you want to clear our chat history? 🧹', 'hey-wapuu'))) {
			setMessages([]);
			sessionStorage.removeItem('hey_wapuu_history');
			window.location.reload();
		}
	}, []);

	// Initialize Speech Recognition
	useEffect(() => {
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		if (SpeechRecognition) {
			recognitionRef.current = new SpeechRecognition();
			recognitionRef.current.continuous = false;
			recognitionRef.current.interimResults = false;
			recognitionRef.current.lang = 'en-US';

			recognitionRef.current.onresult = (event) => {
				const transcript = event.results[0][0].transcript;
				setInput(transcript);
				setIsListening(false);
				setTimeout(() => handleSend(transcript), 500);
			};

			recognitionRef.current.onerror = () => setIsListening(false);
			recognitionRef.current.onend = () => setIsListening(false);
		}
	}, [handleSend]);

	// Persistence & Arrival Awareness
	useEffect(() => {
		const arrivalData = sessionStorage.getItem('hey_wapuu_arrival');
		if (arrivalData) {
			try {
				const { label, time } = JSON.parse(arrivalData);
				if (Date.now() - time < 60000) {
					const cleanLabel = label.replace(/✍️|🏠|📝|🖼️|📤|👗|🛠️|🗺️|👥|➕|💬|🦸‍♂️|🏷️|🖐️|🌍|😂|💛/g, '').trim();
					const arrivalMessage = sprintf(__('We made it! 🚀 We\'re at our destination: **%s**! Ready to start some magic? ✨', 'hey-wapuu'), cleanLabel);
					
					setTimeout(() => {
						setMessages(prev => [...prev, { role: 'ai', text: arrivalMessage }]);
						setIsOpen(true);
						setWapuuMood('celebrate');
						setTimeout(() => setWapuuMood('happy'), 2000);
					}, 1000);
				}
			} catch (e) {}
			sessionStorage.removeItem('hey_wapuu_arrival');
		}

		if (messages.length === 0) {
			const hour = new Date().getHours();
			let timeGreeting = __('Good morning', 'hey-wapuu');
			if (hour >= 12 && hour < 18) timeGreeting = __('Good afternoon', 'hey-wapuu');
			else if (hour >= 18) timeGreeting = __('Good evening', 'hey-wapuu');

			let contextNote = '';
			if (context.screenId === 'site-editor') contextNote = __(' Oh, I see we\'re in the workshop! Ready to change our look? 🛠️✨', 'hey-wapuu');
			else if (context.isEditing) contextNote = __(' I see we\'re working on a story! Want some help with the words? ✍️✨', 'hey-wapuu');

			const tips = [
				__('Wapuu Tip: Did you know you can type / to find blocks even faster? 🚀', 'hey-wapuu'),
				__('Wapuu Tip: You can drag and drop pictures right into our story! 🖼️✨', 'hey-wapuu'),
				__('Wapuu Tip: Keyboard shortcuts are like magic spells for building! 🪄', 'hey-wapuu')
			];
			const randomTip = tips[Math.floor(Math.random() * tips.length)];

			const greetings = [
				sprintf(__('%1$s, %2$s! 💛 I\'m so happy to see you! What should we build on **%3$s** today?%4$s', 'hey-wapuu'), timeGreeting, user.firstName, site.name, contextNote),
				sprintf(__('Hi %1$s! 👋 I was just thinking about **%2$s**. Want to make it even better together?%3$s', 'hey-wapuu'), user.firstName, site.name, contextNote),
				sprintf(__('Ooh, %1$s is here! 🌟 Ready to do some magic on **%2$s**?%3$s', 'hey-wapuu'), user.firstName, site.name, contextNote)
			];
			
			let welcomeText = greetings[Math.floor(Math.random() * greetings.length)];
			if (site.draftCount > 0 && !context.isEditing) {
				welcomeText += sprintf(__(' I saw we have %d stories waiting for us! 📖', 'hey-wapuu'), site.draftCount);
			}
			welcomeText += `\n\n${randomTip}`;

			setTimeout(() => setMessages([{ role: 'ai', text: welcomeText, isInitial: true }]), 300);
		}
	}, []); // Only on mount

	// History and Audio sync
	useEffect(() => {
		sessionStorage.setItem('hey_wapuu_history', JSON.stringify(messages));
		if (messages.length > 0 && messages[messages.length - 1].role === 'ai') {
			playPop();
		}
	}, [messages, playPop]);

	// Global Keyboard Listeners
	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.altKey && e.key.toLowerCase() === 'w') {
				setIsOpen(prev => !prev);
				e.preventDefault();
			}
			if (e.key === 'Escape') {
				setIsOpen(false);
				summonerRef.current?.focus();
			}
			// Tab Trap
			if (isOpen && e.key === 'Tab' && chatWindowRef.current) {
				const focusable = chatWindowRef.current.querySelectorAll('button, input');
				if (focusable.length === 0) return;
				const first = focusable[0];
				const last = focusable[focusable.length - 1];
				if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
				else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isOpen]);

	// Web Worker Lifecycle
	useEffect(() => {
		if (isOpen && workerStatus === 'idle' && window.Worker) {
			setWorkerStatus('initializing');
			workerRef.current = new Worker(heyWapuuConfig.workerUrl);
			workerRef.current.postMessage({ 
				type: 'init', 
				data: { 
					embeddingsUrl: heyWapuuConfig.pluginUrl + 'build/embeddings.json',
					modelUrl: heyWapuuConfig.modelUrl
				} 
			});

			workerRef.current.onmessage = (event) => {
				const { type, data } = event.data;
				if (type === 'status') {
					if (data.status === 'ready') {
						setWorkerStatus('ready');
						setMessages(prev => [...prev, { role: 'ai', text: data.message }]);
					} else if (['downloading', 'loading'].includes(data.status)) {
						setMessages(prev => {
							const newMsgs = [...prev];
							if (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].isStatus) {
								newMsgs[newMsgs.length - 1] = { role: 'ai', text: data.message, isStatus: true };
								return newMsgs;
							}
							return [...prev, { role: 'ai', text: data.message, isStatus: true }];
						});
					}
				} else if (type === 'results') {
					setIsThinking(false);
					setWapuuMood('wiggle');
					setMatches(data.matches);
					
					const topMatch = data.matches.length > 0 ? commandRegistry.find(c => c.id === data.matches[0].id) : null;
					let reply = __('Hmm, I\'m not quite sure I understand that yet. Maybe try saying it a different way? I\'m still learning! 🤔', 'hey-wapuu');
					
					if (topMatch) {
						const responses = [
							__('I can totally help with that, %s! %s ✨', 'hey-wapuu'),
							__('You got it, %s! %s 🚀', 'hey-wapuu'),
							__('Ooh, I know exactly where that is, %s! %s 💛', 'hey-wapuu'),
							__('That sounds like a great idea, %s! %s 🌟', 'hey-wapuu')
						];
						reply = sprintf(responses[Math.floor(Math.random() * responses.length)], user.firstName, topMatch.explanation);
					}
					
					setMessages(prev => [...prev, { role: 'ai', text: reply }]);
					setTimeout(() => setWapuuMood('happy'), 1500);
				}
			};
		}
	}, [isOpen, workerStatus, user.firstName]);

	// Auto-scroll
	useEffect(() => {
		if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
	}, [messages, isThinking]);

	return (
		<>
			<button 
				ref={summonerRef}
				className={`hw-summoner ${isOpen ? 'is-active' : ''} mood-${wapuuMood}`} 
				onClick={() => setIsOpen(!isOpen)} 
				aria-expanded={isOpen}
				aria-haspopup="dialog"
				aria-label={isOpen ? __('Close Wapuu Chat', 'hey-wapuu') : __('Open Wapuu Chat', 'hey-wapuu')}
			>
				{isOpen ? '×' : '💬'}
			</button>

			{isOpen && (
				<div className="hw-chat-window" role="dialog" aria-modal="true" aria-label={__('Wapuu Assistant', 'hey-wapuu')} ref={chatWindowRef}>
					<div className="hw-chat-header">
						<h2>{__('Hey Wapuu! 💛', 'hey-wapuu')}</h2>
						<div className="hw-header-actions">
							<button onClick={clearChat} aria-label={__('Clear Chat', 'hey-wapuu')} className="hw-clear-btn" title={__('Clear Chat', 'hey-wapuu')}>🧹</button>
							<button onClick={() => setIsOpen(false)} aria-label={__('Close Chat', 'hey-wapuu')} className="hw-close-btn">×</button>
						</div>
					</div>

					<div className="hw-chat-content" ref={scrollRef} role="log" aria-live="polite">
						{messages.map((msg, i) => (
							<div key={i} className={`hw-bubble hw-bubble-${msg.role}`}>
								<span dangerouslySetInnerHTML={{ __html: sanitize(msg.text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
								{msg.isInitial && i === 0 && (
									<div className="hw-quick-starts">
										{[
											{ label: __('Start a story ✍️', 'hey-wapuu'), q: 'I want to write a blog post' }, 
											{ label: __('Tell me a joke! 😂', 'hey-wapuu'), q: 'tell me a joke' },
											{ label: __('Who are you? 💛', 'hey-wapuu'), q: 'who are you' }
										].map((qs, j) => (
											<button key={j} className="hw-quick-btn" onClick={() => handleSend(qs.q)}>{qs.label}</button>
										))}
									</div>
								)}
							</div>
						))}
						{isThinking && (
							<div className="hw-bubble hw-bubble-ai hw-thinking" aria-busy="true">
								<span className="screen-reader-text">{__('Wapuu is thinking...', 'hey-wapuu')}</span>
								<span>.</span><span>.</span><span>.</span>
							</div>
						)}
						{matches.length > 0 && (
							<div className="hw-suggestions">
								{matches.map((match) => {
									const cmd = commandRegistry.find(c => c.id === match.id);
									return cmd ? (
										<button key={match.id} className="hw-match-card" onClick={() => runCommand(match.id)}>
											<strong>{sprintf(__('Yes! Let\'s %s 🚀', 'hey-wapuu'), cmd.label.toLowerCase().replace('!', '').replace(/✍️|🏠|📝|🖼️|📤|👗|🛠️|🗺️|👥|➕|💬|🦸‍♂️|🏷️|🖐️|🌍|😂|💛/g, '').trim())}</strong>
											<span>{cmd.explanation}</span>
										</button>
									) : null;
								})}
							</div>
						)}
					</div>

					<div className="hw-input-area">
						<button 
							className={`hw-mic-btn ${isListening ? 'is-listening' : ''}`} 
							onClick={toggleListening}
							aria-label={isListening ? __('Stop Listening', 'hey-wapuu') : __('Talk to Wapuu', 'hey-wapuu')}
							title={__('Voice Input', 'hey-wapuu')}
						>
							{isListening ? '🛑' : '🎤'}
						</button>
						<input 
							ref={inputRef}
							type="text" 
							placeholder={isListening ? __('I\'m listening...', 'hey-wapuu') : __('Talk to me...', 'hey-wapuu')} 
							value={input} 
							onChange={(e) => setInput(e.target.value)} 
							onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
							aria-label={__('Chat message', 'hey-wapuu')} 
						/>
						<button className="hw-send-btn" onClick={() => handleSend()}>{__('Go!', 'hey-wapuu')}</button>
					</div>
				</div>
			)}
		</>
	);
};

const init = () => {
	if (typeof wp !== 'undefined' && wp.element) {
		if (document.getElementById('hey-wapuu-root')) return;
		const root = document.createElement('div');
		root.id = 'hey-wapuu-root';
		document.body.appendChild(root);
		render(<WapuuChatApp />, root);
	}
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
	init();
} else {
	document.addEventListener('DOMContentLoaded', init);
}
