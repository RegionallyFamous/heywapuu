<?php
/**
 * Plugin Name: Hey Wapuu
 * Description: Natural language search for the WordPress Command Palette.
 * Version: 1.6.6
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
 * Check for minimum requirements.
 */
function hey_wapuu_check_requirements() {
	if ( version_compare( $GLOBALS['wp_version'], '6.3', '<' ) ) {
		add_action( 'admin_notices', function() {
			echo '<div class="error"><p>' . esc_html__( 'Hey Wapuu requires WordPress 6.3 or higher to work its magic!', 'hey-wapuu' ) . '</p></div>';
		} );
		return false;
	}
	return true;
}

/**
 * Initialize the plugin.
 */
function hey_wapuu_init() {
	if ( ! hey_wapuu_check_requirements() ) {
		return;
	}
	load_plugin_textdomain( 'hey-wapuu', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
}
add_action( 'init', 'hey_wapuu_init' );

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
	$version = ( defined( 'WP_DEBUG' ) && WP_DEBUG ) ? time() : $asset_file['version'];

	wp_enqueue_script(
		'hey-wapuu-script',
		plugin_dir_url( __FILE__ ) . 'build/index.js',
		$asset_file['dependencies'],
		$version,
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
			$version
		);
	}
	
	// ... (rest of the data preparation)
	$current_user = wp_get_current_user();
	$post_counts  = wp_count_posts();
	$theme        = wp_get_theme();
	$screen       = get_current_screen();
	$comment_counts = wp_count_comments();
	$plugins      = get_plugins();
	$active_plugins = get_option( 'active_plugins' );
	$media_counts = wp_count_attachments();
	$updates      = get_core_updates();
	$has_updates  = ! empty( $updates ) && 'latest' !== $updates[0]->response;
	
	$config = array(
		'pluginUrl' => esc_url_raw( plugin_dir_url( __FILE__ ) ),
		'workerUrl' => esc_url_raw( plugin_dir_url( __FILE__ ) . 'build/nlu-worker.js?ver=' . $version ),
		'modelUrl'  => esc_url_raw( plugin_dir_url( __FILE__ ) . 'models/' ),
		'version'   => $version,
		'embeddingsUrl' => esc_url_raw( plugin_dir_url( __FILE__ ) . 'build/embeddings.json?ver=' . $version ),
		'nonce'     => wp_create_nonce( 'hey_wapuu_nonce' ),
		'user' => array(
			'firstName' => esc_html( $current_user->user_firstname ?: $current_user->display_name ),
			'nickname'  => esc_html( $current_user->nickname ),
			'role'      => esc_html( (string) ( reset($current_user->roles) ?: 'subscriber' ) ),
		),
		'site' => array(
			'name'          => esc_html( get_bloginfo( 'name' ) ),
			'url'           => esc_url( get_home_url() ),
			'postCount'     => (int) $post_counts->publish,
			'draftCount'    => (int) $post_counts->draft,
			'themeName'     => esc_html( $theme->get( 'Name' ) ),
			'commentCount'  => (int) $comment_counts->approved,
			'pendingComments' => (int) $comment_counts->moderated,
			'pluginCount'   => count( $plugins ),
			'activePlugins' => count( $active_plugins ),
			'mediaCount'    => (int) $media_counts->inherit, // attachments are 'inherit'
			'hasUpdates'    => (bool) $has_updates,
			'locale'        => get_locale(),
		),
		'context' => array(
			'screenId'  => $screen ? esc_js( $screen->id ) : '',
			'postType'  => $screen ? esc_js( $screen->post_type ) : '',
			'isEditing' => $screen && ( $screen->base === 'post' || $screen->base === 'edit' ),
		)
	);

	wp_localize_script( 'hey-wapuu-script', 'heyWapuuConfig', $config );

	// Add resource hints for performance
	add_action( 'admin_head', function() use ( $config ) {
		// Use 'script' instead of 'worker' for wider browser support in preload
		echo '<link rel="preload" href="' . esc_url( $config['workerUrl'] ) . '" as="script" crossorigin="anonymous">' . "\n";
		echo '<link rel="preload" href="' . esc_url( $config['embeddingsUrl'] ) . '" as="fetch" crossorigin="anonymous">' . "\n";
		// Preload the quantized weights (the largest file)
		echo '<link rel="preload" href="' . esc_url( $config['modelUrl'] . 'all-MiniLM-L6-v2/onnx/model_quantized.onnx' ) . '" as="fetch" crossorigin="anonymous">' . "\n";
	} );
}
add_action( 'admin_enqueue_scripts', 'hey_wapuu_enqueue_assets' );

/**
 * Add action links to the plugin list.
 *
 * @param array $links Existing links.
 * @return array Modified links.
 */
function hey_wapuu_action_links( $links ) {
	$new_links = array(
		'<a href="https://github.com/regionallyfamous/heywapuu" target="_blank">' . __( 'Support', 'hey-wapuu' ) . '</a>',
	);
	return array_merge( $links, $new_links );
}
add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'hey_wapuu_action_links' );

/**
 * Cleanup on deactivation.
 */
function hey_wapuu_deactivate() {
	// Flush rewrite rules for safety.
	flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'hey_wapuu_deactivate' );
