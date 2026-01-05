import { useState, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { isSafeUrl } from '../utils/helpers.js';

/**
 * Hook for scraping the WordPress sidebar menu
 */
export const useSidebarScraper = () => {
	const [ dynamicCommands, setDynamicCommands ] = useState( [] );

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

	return dynamicCommands;
};
