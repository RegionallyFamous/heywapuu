/* eslint-disable @wordpress/i18n-text-domain, @wordpress/i18n-no-variables */
/**
 * Translation helper for both Browser and Node.
 * Standard WP-CLI/POT tools will recognize this as a translation function.
 *
 * @param {string} text   The text to translate.
 * @param {string} domain The text domain.
 */
const __ = ( text, domain ) => {
	if ( typeof window !== 'undefined' && window.wp && window.wp.i18n ) {
		return window.wp.i18n.__( text, domain );
	}
	return text;
};

/**
 * Hey Wapuu Conversational Registry - Professional Edition
 */

export const commands = [
	// --- POSTS & PAGES ---
	{
		id: 'core/add-new-post',
		label: __( 'Create a new post', 'hey-wapuu' ),
		explanation: __(
			'Open the editor to start a new blog post.',
			'hey-wapuu'
		),
		descriptions: [
			'write a story',
			'make a new blog post',
			'create a post',
			'new post',
			'tell a secret',
			'new article',
			'share a thought',
			'start a post',
		],
		url: 'post-new.php',
	},
	{
		id: 'core/add-new-page',
		label: __( 'Create a new page', 'hey-wapuu' ),
		explanation: __(
			'Open the editor to create a new static page.',
			'hey-wapuu'
		),
		descriptions: [
			'create a new page',
			'make a static page',
			'new about page',
			'new contact page',
			'add a page',
		],
		url: 'post-new.php?post_type=page',
	},
	{
		id: 'core/manage-posts',
		label: __( 'Manage all posts', 'hey-wapuu' ),
		explanation: __(
			'View and edit your existing blog posts.',
			'hey-wapuu'
		),
		descriptions: [
			'show all posts',
			'view post list',
			'manage my articles',
			'all my stories',
		],
		url: 'edit.php',
	},
	{
		id: 'core/manage-categories',
		label: __( 'Manage categories', 'hey-wapuu' ),
		explanation: __( 'Organize your posts into categories.', 'hey-wapuu' ),
		descriptions: [
			'manage categories',
			'edit categories',
			'post categories',
		],
		url: 'edit-tags.php?taxonomy=category',
	},
	{
		id: 'core/manage-tags',
		label: __( 'Manage tags', 'hey-wapuu' ),
		explanation: __( 'Organize your posts using tags.', 'hey-wapuu' ),
		descriptions: [ 'manage tags', 'edit tags', 'post tags' ],
		url: 'edit-tags.php?taxonomy=post_tag',
	},
	{
		id: 'core/manage-pages',
		label: __( 'Manage all pages', 'hey-wapuu' ),
		explanation: __(
			'View and edit your existing static pages.',
			'hey-wapuu'
		),
		descriptions: [
			'show all pages',
			'view page list',
			'manage pages',
			'all my pages',
		],
		url: 'edit.php?post_type=page',
	},

	// --- MEDIA ---
	{
		id: 'core/open-media-library',
		label: __( 'Open media library', 'hey-wapuu' ),
		explanation: __(
			'View and manage your images, videos, and files.',
			'hey-wapuu'
		),
		descriptions: [
			'show pictures',
			'find images',
			'open gallery',
			'uploaded files',
			'photos library',
			'manage media',
		],
		url: 'upload.php',
	},
	{
		id: 'core/add-new-media',
		label: __( 'Add new media', 'hey-wapuu' ),
		explanation: __(
			'Upload new files to your media library.',
			'hey-wapuu'
		),
		descriptions: [
			'upload image',
			'add photo',
			'new video',
			'upload file',
			'add media',
		],
		url: 'media-new.php',
	},

	// --- APPEARANCE ---
	{
		id: 'core/open-appearance-themes',
		label: __( 'Manage themes', 'hey-wapuu' ),
		explanation: __(
			'Change the appearance and design of your site.',
			'hey-wapuu'
		),
		descriptions: [
			'change look',
			'find design',
			'new theme',
			'manage themes',
			'appearance',
		],
		url: 'themes.php',
	},
	{
		id: 'core/open-site-editor',
		label: __( 'Open site editor', 'hey-wapuu' ),
		explanation: __(
			'Edit your site layout and design globally.',
			'hey-wapuu'
		),
		descriptions: [
			'edit site',
			'change layout',
			'full site editing',
			'open editor',
			'customize theme',
		],
		url: 'site-editor.php',
	},
	{
		id: 'core/open-navigation',
		label: __( 'Manage navigation', 'hey-wapuu' ),
		explanation: __( 'Edit your site menus and navigation.', 'hey-wapuu' ),
		descriptions: [ 'edit navigation', 'change menus', 'site navigation' ],
		url: 'site-editor.php?path=%2Fnavigation',
	},
	{
		id: 'core/open-styles',
		label: __( 'Edit site styles', 'hey-wapuu' ),
		explanation: __(
			'Change global colors, fonts, and styles.',
			'hey-wapuu'
		),
		descriptions: [
			'edit styles',
			'change colors',
			'typography',
			'global styles',
		],
		url: 'site-editor.php?path=%2Fstyles',
	},
	{
		id: 'core/open-templates',
		label: __( 'Manage templates', 'hey-wapuu' ),
		explanation: __( 'Edit page and post templates.', 'hey-wapuu' ),
		descriptions: [
			'show templates',
			'manage blueprints',
			'edit templates',
		],
		url: 'site-editor.php?path=%2Ftemplates',
	},
	{
		id: 'core/open-template-parts',
		label: __( 'Manage template parts', 'hey-wapuu' ),
		explanation: __(
			'Edit headers, footers, and other template components.',
			'hey-wapuu'
		),
		descriptions: [ 'show template parts', 'edit header', 'edit footer' ],
		url: 'site-editor.php?path=%2Ftemplate-parts',
	},
	{
		id: 'core/open-patterns',
		label: __( 'Manage patterns', 'hey-wapuu' ),
		explanation: __(
			'Create and manage reusable block patterns.',
			'hey-wapuu'
		),
		descriptions: [ 'manage patterns', 'show patterns', 'reusable blocks' ],
		url: 'site-editor.php?path=%2Fpatterns',
	},
	{
		id: 'core/open-appearance-menus',
		label: __( 'Manage menus', 'hey-wapuu' ),
		explanation: __( 'Edit your navigation menus.', 'hey-wapuu' ),
		descriptions: [
			'change menu',
			'edit navigation',
			'fix links',
			'menu settings',
		],
		url: 'nav-menus.php',
	},
	{
		id: 'core/open-appearance-widgets',
		label: __( 'Manage widgets', 'hey-wapuu' ),
		explanation: __(
			'Edit sidebars and footers using widgets.',
			'hey-wapuu'
		),
		descriptions: [
			'change widgets',
			'edit sidebar',
			'add footer blocks',
			'manage widgets',
		],
		url: 'widgets.php',
	},
	{
		id: 'core/open-appearance-customizer',
		label: __( 'Open customizer', 'hey-wapuu' ),
		explanation: __(
			'Customize your site appearance with live preview.',
			'hey-wapuu'
		),
		descriptions: [
			'open customizer',
			'change colors',
			'header settings',
			'site identity',
		],
		url: 'customize.php',
	},

	// --- USERS & FRIENDS ---
	{
		id: 'core/manage-users',
		label: __( 'Manage users', 'hey-wapuu' ),
		explanation: __( 'View and manage all site users.', 'hey-wapuu' ),
		descriptions: [
			'show users',
			'view team',
			'manage people',
			'who is here',
		],
		url: 'users.php',
	},
	{
		id: 'core/add-new-user',
		label: __( 'Add new user', 'hey-wapuu' ),
		explanation: __(
			'Create a new user account for your site.',
			'hey-wapuu'
		),
		descriptions: [
			'add user',
			'new member',
			'invite person',
			'create account',
		],
		url: 'user-new.php',
	},
	{
		id: 'core/open-user-profile',
		label: __( 'Edit my profile', 'hey-wapuu' ),
		explanation: __(
			'Manage your personal account settings.',
			'hey-wapuu'
		),
		descriptions: [
			'my profile',
			'edit me',
			'change my password',
			'my account',
			'who am i',
		],
		url: 'profile.php',
	},
	{
		id: 'core/manage-comments',
		label: __( 'Manage comments', 'hey-wapuu' ),
		explanation: __( 'View and moderate site comments.', 'hey-wapuu' ),
		descriptions: [
			'show comments',
			'see feedback',
			'read messages',
			'who commented',
		],
		url: 'edit-comments.php',
	},

	// --- TOOLS & PLUGINS ---
	{
		id: 'core/open-plugins',
		label: __( 'Manage plugins', 'hey-wapuu' ),
		explanation: __(
			'View and manage your installed plugins.',
			'hey-wapuu'
		),
		descriptions: [
			'add features',
			'manage extensions',
			'installed plugins',
			'new tools',
		],
		url: 'plugins.php',
	},
	{
		id: 'core/add-new-plugin',
		label: __( 'Add new plugin', 'hey-wapuu' ),
		explanation: __( 'Search for and install new plugins.', 'hey-wapuu' ),
		descriptions: [ 'install plugin', 'search plugins', 'add new plugin' ],
		url: 'plugin-install.php',
	},
	{
		id: 'core/open-settings-general',
		label: __( 'General settings', 'hey-wapuu' ),
		explanation: __(
			'Manage core site settings and information.',
			'hey-wapuu'
		),
		descriptions: [
			'site title',
			'change description',
			'general settings',
			'change name',
		],
		url: 'options-general.php',
	},
	{
		id: 'core/open-settings-writing',
		label: __( 'Writing settings', 'hey-wapuu' ),
		explanation: __(
			'Manage settings related to post creation.',
			'hey-wapuu'
		),
		descriptions: [
			'writing settings',
			'default category',
			'post via email',
		],
		url: 'options-writing.php',
	},
	{
		id: 'core/open-settings-reading',
		label: __( 'Reading settings', 'hey-wapuu' ),
		explanation: __(
			'Manage how content is displayed to visitors.',
			'hey-wapuu'
		),
		descriptions: [
			'reading settings',
			'homepage settings',
			'how many posts',
		],
		url: 'options-reading.php',
	},
	{
		id: 'core/open-settings-discussion',
		label: __( 'Discussion settings', 'hey-wapuu' ),
		explanation: __(
			'Manage comment settings and moderation rules.',
			'hey-wapuu'
		),
		descriptions: [ 'discussion settings', 'comment rules', 'avatars' ],
		url: 'options-discussion.php',
	},
	{
		id: 'core/open-settings-media',
		label: __( 'Media settings', 'hey-wapuu' ),
		explanation: __(
			'Manage image sizes and upload organization.',
			'hey-wapuu'
		),
		descriptions: [ 'media settings', 'image sizes', 'organize uploads' ],
		url: 'options-media.php',
	},
	{
		id: 'core/open-settings-permalinks',
		label: __( 'Permalink settings', 'hey-wapuu' ),
		explanation: __( 'Manage URL structure for your site.', 'hey-wapuu' ),
		descriptions: [ 'permalink settings', 'change urls', 'link structure' ],
		url: 'options-permalink.php',
	},
	{
		id: 'core/open-settings-privacy',
		label: __( 'Privacy settings', 'hey-wapuu' ),
		explanation: __(
			'Manage your privacy policy and data settings.',
			'hey-wapuu'
		),
		descriptions: [ 'privacy settings', 'privacy policy' ],
		url: 'options-privacy.php',
	},
	{
		id: 'core/open-tools-available',
		label: __( 'Available tools', 'hey-wapuu' ),
		explanation: __(
			'View additional tools available for your site.',
			'hey-wapuu'
		),
		descriptions: [ 'available tools', 'show all tools' ],
		url: 'tools.php',
	},
	{
		id: 'core/open-tools-site-health',
		label: __( 'Site health', 'hey-wapuu' ),
		explanation: __( 'Check your site health and status.', 'hey-wapuu' ),
		descriptions: [
			'site health',
			'is my site okay',
			'check for problems',
		],
		url: 'site-health.php',
	},
	{
		id: 'core/open-tools-export',
		label: __( 'Export content', 'hey-wapuu' ),
		explanation: __(
			'Export your site content to an XML file.',
			'hey-wapuu'
		),
		descriptions: [
			'export content',
			'download my site',
			'back up my stories',
			'save my work',
		],
		url: 'export.php',
	},
	{
		id: 'core/open-tools-import',
		label: __( 'Import content', 'hey-wapuu' ),
		explanation: __( 'Import content from other sites.', 'hey-wapuu' ),
		descriptions: [
			'import content',
			'upload site data',
			'bring in stories',
		],
		url: 'import.php',
	},
	{
		id: 'core/open-tools-export-personal-data',
		label: __( 'Export personal data', 'hey-wapuu' ),
		explanation: __(
			'Export personal data for a specific user.',
			'hey-wapuu'
		),
		descriptions: [ 'export personal data', 'privacy export' ],
		url: 'export-personal-data.php',
	},
	{
		id: 'core/open-tools-erase-personal-data',
		label: __( 'Erase personal data', 'hey-wapuu' ),
		explanation: __(
			'Erase personal data for a specific user.',
			'hey-wapuu'
		),
		descriptions: [ 'erase personal data', 'privacy erase' ],
		url: 'erase-personal-data.php',
	},
	{
		id: 'core/open-updates',
		label: __( 'Check for updates', 'hey-wapuu' ),
		explanation: __(
			'Check for WordPress core, plugin, and theme updates.',
			'hey-wapuu'
		),
		descriptions: [
			'check for updates',
			'update wordpress',
			'update plugins',
			'new versions',
		],
		url: 'update-core.php',
	},

	// --- EDITOR MAGIC ---
	{
		id: 'core/toggle-distraction-free',
		label: __( 'Distraction-free mode', 'hey-wapuu' ),
		explanation: __(
			'Hide editor sidebars and toolbars for focused writing.',
			'hey-wapuu'
		),
		descriptions: [
			'distraction free mode',
			'hide sidebar',
			'clean editor',
			'focus mode',
		],
	},
	{
		id: 'core/toggle-spotlight-mode',
		label: __( 'Spotlight mode', 'hey-wapuu' ),
		explanation: __(
			'Focus on the currently selected block.',
			'hey-wapuu'
		),
		descriptions: [
			'spotlight mode',
			'focus on block',
			'dim other blocks',
		],
	},
	{
		id: 'core/toggle-list-view',
		label: __( 'Show list view', 'hey-wapuu' ),
		explanation: __(
			'View the hierarchical structure of your blocks.',
			'hey-wapuu'
		),
		descriptions: [
			'list view',
			'show blocks',
			'outline',
			'document structure',
		],
	},
	{
		id: 'core/toggle-fullscreen-mode',
		label: __( 'Fullscreen mode', 'hey-wapuu' ),
		explanation: __( 'Toggle fullscreen editing mode.', 'hey-wapuu' ),
		descriptions: [ 'fullscreen mode', 'max editor', 'big screen' ],
	},
	{
		id: 'core/toggle-feature-welcome-guide',
		label: __( 'Welcome guide', 'hey-wapuu' ),
		explanation: __( 'Open the editor welcome guide.', 'hey-wapuu' ),
		descriptions: [ 'welcome guide', 'how to use editor', 'tutorial' ],
	},
	{
		id: 'core/toggle-fixed-toolbar',
		label: __( 'Fixed toolbar', 'hey-wapuu' ),
		explanation: __(
			'Fix the block toolbar to the top of the editor.',
			'hey-wapuu'
		),
		descriptions: [ 'fixed toolbar', 'top toolbar' ],
	},
	{
		id: 'core/open-preferences',
		label: __( 'Editor preferences', 'hey-wapuu' ),
		explanation: __(
			'Manage your editor settings and preferences.',
			'hey-wapuu'
		),
		descriptions: [ 'editor preferences', 'change settings' ],
	},
	{
		id: 'core/open-keyboard-shortcuts',
		label: __( 'Keyboard shortcuts', 'hey-wapuu' ),
		explanation: __(
			'View a list of available keyboard shortcuts.',
			'hey-wapuu'
		),
		descriptions: [ 'keyboard shortcuts', 'hotkeys' ],
	},

	// --- FUN & SYSTEM ---
	{
		id: 'core/open-dashboard',
		label: __( 'Go to dashboard', 'hey-wapuu' ),
		explanation: __(
			'Return to the main WordPress dashboard.',
			'hey-wapuu'
		),
		descriptions: [
			'go home',
			'main menu',
			'wp-admin',
			'start page',
			'back to start',
		],
		url: 'index.php',
	},
	{
		id: 'core/view-site',
		label: __( 'View site', 'hey-wapuu' ),
		explanation: __(
			'View the public front-end of your site.',
			'hey-wapuu'
		),
		descriptions: [
			'show my website',
			'visit site',
			'preview live',
			'how does it look',
			'open front end',
		],
		url: '/',
	},
	{
		id: 'wapuu/tell-joke',
		label: __( 'Tell a joke', 'hey-wapuu' ),
		explanation: __(
			'I can tell you a WordPress-related joke.',
			'hey-wapuu'
		),
		descriptions: [
			'tell me a joke',
			'make me laugh',
			'say something funny',
		],
		action: 'joke',
	},
	{
		id: 'wapuu/who-are-you',
		label: __( 'About me', 'hey-wapuu' ),
		explanation: __( 'Learn more about who I am.', 'hey-wapuu' ),
		descriptions: [
			'who are you',
			'what is a wapuu',
			'tell me about yourself',
		],
		action: 'about',
	},
	{
		id: 'wapuu/sing-song',
		label: __( 'Sing a song', 'hey-wapuu' ),
		explanation: __(
			'I can sing a short song about WordPress.',
			'hey-wapuu'
		),
		descriptions: [
			'sing a song',
			'can you sing',
			'make music',
			'sing for me',
		],
		action: 'song',
	},
	{
		id: 'wapuu/why-warm-up',
		label: __( 'Warming up', 'hey-wapuu' ),
		explanation: __( 'Learn why I need to warm up my brain.', 'hey-wapuu' ),
		descriptions: [ 'why', 'why are you warming up', 'what are you doing' ],
		action: 'why',
	},
	{
		id: 'wapuu/how-to-build',
		label: __( 'Building a site', 'hey-wapuu' ),
		explanation: __(
			'I can give you tips on building a great site.',
			'hey-wapuu'
		),
		descriptions: [
			'how to build',
			'help me build',
			'give me tips',
			'how do i start',
			'website advice',
		],
		action: 'tips',
	},
	{
		id: 'wapuu/what-can-you-do',
		label: __( 'Help', 'hey-wapuu' ),
		explanation: __(
			'See a list of all commands I can help with.',
			'hey-wapuu'
		),
		descriptions: [
			'help',
			'what can you do',
			'show me everything',
			'commands list',
			'capabilities',
		],
		action: 'help',
	},
	{
		id: 'wapuu/site-status',
		label: __( 'Site status', 'hey-wapuu' ),
		explanation: __(
			'Get a quick overview of your site status.',
			'hey-wapuu'
		),
		descriptions: [
			'site status',
			'how is the site',
			'check up',
			'health',
		],
		action: 'status',
	},
];
