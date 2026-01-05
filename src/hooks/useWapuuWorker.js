/* global heyWapuuConfig, Worker */
import {
	useState,
	useEffect,
	useRef,
	useCallback,
	useMemo,
} from '@wordpress/element';

/**
 * Hook for managing the NLU Worker lifecycle
 *
 * @param {Object}   options                 Options.
 * @param {Array}    options.dynamicCommands Learned sidebar commands.
 * @param {Function} options.onResults       Callback for query results.
 * @param {Function} options.onError         Callback for errors.
 */
export const useWapuuWorker = ( { dynamicCommands, onResults, onError } ) => {
	const [ workerStatus, setWorkerStatus ] = useState( 'idle' );
	const [ loadingProgress, setLoadingProgress ] = useState( 0 );
	const [ isReadyNotification, setIsReadyNotification ] = useState( false );
	const [ bootTime, setBootTime ] = useState( Date.now() );
	const workerRef = useRef( null );

	const forceRestart = useCallback( () => {
		if ( workerRef.current ) {
			workerRef.current.terminate();
			workerRef.current = null;
		}
		setWorkerStatus( 'idle' );
		setBootTime( Date.now() );
	}, [] );

	// Watchdog: Detect if worker is stuck
	const isStuck = useMemo(
		() =>
			( workerStatus === 'initializing' || workerStatus === 'loading' ) &&
			Date.now() - bootTime > 15000,
		[ workerStatus, bootTime ]
	);

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
			if ( workerRef.current || ! window.Worker ) {
				return;
			}

			setWorkerStatus( 'initializing' );

			try {
				const workerUrl = heyWapuuConfig.workerUrl;
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
						onError();
					} else if ( type === 'results' ) {
						onResults( data );
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
	}, [ workerStatus, onError, onResults ] );

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

	const postToWorker = useCallback( ( msg ) => {
		if ( workerRef.current ) {
			workerRef.current.postMessage( msg );
		}
	}, [] );

	return {
		workerStatus,
		loadingProgress,
		isReadyNotification,
		isStuck,
		forceRestart,
		postToWorker,
	};
};
