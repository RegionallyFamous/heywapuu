<?php
/**
 * Plugin Name: Hey Wapuu
 * Description: Natural language search for the WordPress Command Palette.
 * Version: 1.0.0
 * Author: Regionally Famous
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: hey-wapuu
 * Domain Path: /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Enqueue administrative assets.
 */
function hey_wapuu_enqueue_assets() {
	if ( ! current_user_can( 'edit_posts' ) ) {
		return;
	}

	$asset_file_path = plugin_dir_path( __FILE__ ) . 'build/index.asset.php';
	
	if ( ! file_exists( $asset_file_path ) ) {
		return;
	}

	$asset_file = include $asset_file_path;

	wp_enqueue_script(
		'hey-wapuu-script',
		plugin_dir_url( __FILE__ ) . 'build/index.js',
		$asset_file['dependencies'],
		$asset_file['version'],
		true
	);

	// Load translations for the JavaScript.
	wp_set_script_translations( 'hey-wapuu-script', 'hey-wapuu', plugin_dir_path( __FILE__ ) . 'languages' );

	// Load compiled CSS.
	$is_rtl = is_rtl();
	$css_file = $is_rtl ? 'style-index-rtl.css' : 'style-index.css';
	$css_file_url = plugin_dir_url( __FILE__ ) . 'build/' . $css_file;
	$css_file_path = plugin_dir_path( __FILE__ ) . 'build/' . $css_file;

	if ( file_exists( $css_file_path ) ) {
		wp_enqueue_style(
			'hey-wapuu-style',
			$css_file_url,
			array(),
			$asset_file['version']
		);
	}

	// Prepare data for localization
	$current_user = wp_get_current_user();
	$post_counts  = wp_count_posts();
	$theme        = wp_get_theme();
	$screen       = get_current_screen();
	
	$config = array(
		'pluginUrl' => esc_url_raw( plugin_dir_url( __FILE__ ) ),
		'workerUrl' => esc_url_raw( plugin_dir_url( __FILE__ ) . 'build/nlu-worker.js' ),
		'modelUrl'  => esc_url_raw( plugin_dir_url( __FILE__ ) . 'models/' ),
		'user' => array(
			'firstName' => esc_html( $current_user->user_firstname ?: $current_user->display_name ),
			'nickname'  => esc_html( $current_user->nickname ),
			'role'      => esc_html( (string) ( reset($current_user->roles) ?: 'subscriber' ) ),
		),
		'site' => array(
			'name'       => esc_html( get_bloginfo( 'name' ) ),
			'postCount'  => (int) $post_counts->publish,
			'draftCount' => (int) $post_counts->draft,
			'themeName'  => esc_html( $theme->get( 'Name' ) ),
		),
		'context' => array(
			'screenId'  => $screen ? esc_js( $screen->id ) : '',
			'postType'  => $screen ? esc_js( $screen->post_type ) : '',
			'isEditing' => $screen && ( $screen->base === 'post' || $screen->base === 'edit' ),
		)
	);

	wp_localize_script( 'hey-wapuu-script', 'heyWapuuConfig', $config );
}
add_action( 'admin_enqueue_scripts', 'hey_wapuu_enqueue_assets' );

/**
 * Cleanup on deactivation.
 */
function hey_wapuu_deactivate() {
	// Any cleanup tasks go here
	flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'hey_wapuu_deactivate' );
