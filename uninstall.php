<?php
/**
 * Hey Wapuu Uninstall
 *
 * This file is called when the plugin is deleted.
 * 
 * @package HeyWapuu
 */

// If uninstall not called from WordPress, then exit.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Hey Wapuu is a "zero configuration" plugin and currently doesn't 
// store any persistent data in the database. All chat history 
// is stored in the browser's sessionStorage.

