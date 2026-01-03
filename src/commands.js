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
 * Hey Wapuu Conversational Registry - The "Wonder" Edition
 */

export const commands = [
	// --- POSTS & PAGES ---
	{
		id: 'core/add-new-post',
		label: __( 'Start a new storybook! ✍️', 'hey-wapuu' ),
		explanation: __(
			'I can open a fresh page so we can start writing our next big adventure! 📖✨',
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
		label: __( 'Build a new secret hideout! 🏠', 'hey-wapuu' ),
		explanation: __(
			"I'll take us to the page builder so we can create a whole new place for people to visit! 💎✨",
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
		label: __( 'Visit our library of stories! 📝', 'hey-wapuu' ),
		explanation: __(
			"I'll show you every single thing we've ever written together. It's a big collection! 🗂️📚",
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
		label: __( 'Sort our stories into folders! 📁', 'hey-wapuu' ),
		explanation: __(
			"I'll help you organize our stories into different categories so they're easy to find! ✨",
			'hey-wapuu'
		),
		descriptions: [
			'manage categories',
			'edit categories',
			'post categories',
		],
		url: 'edit-tags.php?taxonomy=category',
	},
	{
		id: 'core/manage-tags',
		label: __( 'Add some sticky labels! 🏷️', 'hey-wapuu' ),
		explanation: __(
			"I'll help you add tags to our stories so we can label them with magic words! ✨",
			'hey-wapuu'
		),
		descriptions: [ 'manage tags', 'edit tags', 'post tags' ],
		url: 'edit-tags.php?taxonomy=post_tag',
	},
	{
		id: 'core/manage-pages',
		label: __( 'Check out our secret hideouts! 🏠', 'hey-wapuu' ),
		explanation: __(
			"I'll show you all the different places we've built on our site! 🗺️✨",
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
		label: __( 'Open our magic treasure chest! 🖼️', 'hey-wapuu' ),
		explanation: __(
			"I'll show you all our pictures, videos, and secrets we've tucked away! 💎✨",
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
		label: __( 'Add something new to the chest! 📤', 'hey-wapuu' ),
		explanation: __(
			'I can help you upload a new photo or a cool video to our collection! 📸✨',
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
		label: __( 'Pick out a new outfit! 👗', 'hey-wapuu' ),
		explanation: __(
			'I can show you all the different ways we can dress up our site today! 🎨✨',
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
		label: __( 'Go to the master workshop! 🛠️', 'hey-wapuu' ),
		explanation: __(
			"I'll take you to the big editor where we can change how everything looks at once! 🏛️✨",
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
		label: __( 'Fix our navigation map! 🧭', 'hey-wapuu' ),
		explanation: __(
			"I'll take you to the navigation settings in the workshop! ✨",
			'hey-wapuu'
		),
		descriptions: [ 'edit navigation', 'change menus', 'site navigation' ],
		url: 'site-editor.php?path=%2Fnavigation',
	},
	{
		id: 'core/open-styles',
		label: __( "Change our site's colors and clothes! 🎨", 'hey-wapuu' ),
		explanation: __(
			"I'll open the Styles menu where we can change colors, fonts, and more! ✨",
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
		label: __( 'See all our magic blueprints! 📐', 'hey-wapuu' ),
		explanation: __(
			"I'll show you the templates we use to build our pages! ✨",
			'hey-wapuu'
		),
		descriptions: [
			'show templates',
			'manage blueprints',
			'edit templates',
		],
		url: 'site-editor.php?path=%2Ftemplates',
	},
	{
		id: 'core/open-template-parts',
		label: __( 'Check out our building blocks! 🧱', 'hey-wapuu' ),
		explanation: __(
			"I'll show you the parts we use to build our site, like headers and footers! ✨",
			'hey-wapuu'
		),
		descriptions: [ 'show template parts', 'edit header', 'edit footer' ],
		url: 'site-editor.php?path=%2Ftemplate-parts',
	},
	{
		id: 'core/open-patterns',
		label: __( 'Look at our magic patterns! 💠', 'hey-wapuu' ),
		explanation: __(
			"I'll show you all the patterns we can use to build beautiful pages fast! ✨",
			'hey-wapuu'
		),
		descriptions: [ 'manage patterns', 'show patterns', 'reusable blocks' ],
		url: 'site-editor.php?path=%2Fpatterns',
	},
	{
		id: 'core/open-appearance-menus',
		label: __( 'Fix our treasure map! 🗺️', 'hey-wapuu' ),
		explanation: __(
			"I'll help you change the menus so our friends always find their way! 🧭✨",
			'hey-wapuu'
		),
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
		label: __( 'Add some gadgets to the sidebar! 🔌', 'hey-wapuu' ),
		explanation: __(
			'I can help you add little magic boxes and helpers to the sides of our pages! 🛠️✨',
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
		label: __( 'Paint and polish our site! 🎨', 'hey-wapuu' ),
		explanation: __(
			"I'll take you to the magic mirror where we can see changes as we make them! ✨🪞",
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
		label: __( 'See all our teammates! 👥', 'hey-wapuu' ),
		explanation: __(
			"I'll show you everyone who is helping us build this awesome site! 🤝✨",
			'hey-wapuu'
		),
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
		label: __( 'Invite a new friend! ➕', 'hey-wapuu' ),
		explanation: __(
			'I can help you add someone new to our team so they can help us too! 👤✨',
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
		label: __( 'Look in the magic mirror! 🪞', 'hey-wapuu' ),
		explanation: __(
			"I'll show you your own profile so you can change your name or picture! ✨",
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
		label: __( 'Read our mail from friends! 💬', 'hey-wapuu' ),
		explanation: __(
			"I'll take us to see all the nice things people are saying about our work! 💖✨",
			'hey-wapuu'
		),
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
		label: __( 'Get some new superpowers! 🦸‍♂️', 'hey-wapuu' ),
		explanation: __(
			"I'll show you all the extra tools we can plug in to make our site even better! ⚡✨",
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
		label: __( 'Find a brand new superpower! ➕🦸‍♂️', 'hey-wapuu' ),
		explanation: __(
			"I'll take you to the plugin store where we can find new magic tools! ✨",
			'hey-wapuu'
		),
		descriptions: [ 'install plugin', 'search plugins', 'add new plugin' ],
		url: 'plugin-install.php',
	},
	{
		id: 'core/open-settings-general',
		label: __( "Change our site's name! 🏷️", 'hey-wapuu' ),
		explanation: __(
			'I can take you to the main control room to change the basics! ⚙️✨',
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
		label: __( 'Fix our writing desk! ✍️', 'hey-wapuu' ),
		explanation: __(
			"I'll help you set up how we write our stories! 🖋️✨",
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
		label: __( 'Set up our reading room! 📖', 'hey-wapuu' ),
		explanation: __(
			"I'll help you decide how people see our stories on the front page! 👀✨",
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
		label: __( 'Manage our chat rules! 💬', 'hey-wapuu' ),
		explanation: __(
			"I'll help you set the rules for how friends can talk to us! 🗣️✨",
			'hey-wapuu'
		),
		descriptions: [ 'discussion settings', 'comment rules', 'avatars' ],
		url: 'options-discussion.php',
	},
	{
		id: 'core/open-settings-media',
		label: __( 'Organize our photo studio! 📸', 'hey-wapuu' ),
		explanation: __(
			"I'll help you set up how we store our pictures and videos! ✨",
			'hey-wapuu'
		),
		descriptions: [ 'media settings', 'image sizes', 'organize uploads' ],
		url: 'options-media.php',
	},
	{
		id: 'core/open-settings-permalinks',
		label: __( 'Fix our magic addresses! 🔗', 'hey-wapuu' ),
		explanation: __(
			"I'll help you make our web addresses look pretty and easy to find! ✨",
			'hey-wapuu'
		),
		descriptions: [ 'permalink settings', 'change urls', 'link structure' ],
		url: 'options-permalink.php',
	},
	{
		id: 'core/open-settings-privacy',
		label: __( 'Keep our secrets safe! 🤫', 'hey-wapuu' ),
		explanation: __(
			"I'll help you set up our privacy policy and keep our friends safe! ✨",
			'hey-wapuu'
		),
		descriptions: [ 'privacy settings', 'privacy policy' ],
		url: 'options-privacy.php',
	},
	{
		id: 'core/open-tools-available',
		label: __( 'See our box of magic tricks! 🪄', 'hey-wapuu' ),
		explanation: __(
			"I'll show you all the extra tools we have available to use! ✨",
			'hey-wapuu'
		),
		descriptions: [ 'available tools', 'show all tools' ],
		url: 'tools.php',
	},
	{
		id: 'core/open-tools-site-health',
		label: __( 'Give our site a check-up! 🩺', 'hey-wapuu' ),
		explanation: __(
			"I'll check if our site is feeling strong or if it needs some magic medicine! 🏥✨",
			'hey-wapuu'
		),
		descriptions: [
			'site health',
			'is my site okay',
			'check for problems',
		],
		url: 'site-health.php',
	},
	{
		id: 'core/open-tools-export',
		label: __( 'Pack our bags for an adventure! 🎒', 'hey-wapuu' ),
		explanation: __(
			"I'll help you export our stories and treasures so we can take them somewhere new! 🚀✨",
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
		label: __( 'Welcome new friends and stories! 📥', 'hey-wapuu' ),
		explanation: __(
			"I'll help you bring in new treasures and stories from other worlds! 🌟✨",
			'hey-wapuu'
		),
		descriptions: [
			'import content',
			'upload site data',
			'bring in stories',
		],
		url: 'import.php',
	},
	{
		id: 'core/open-tools-export-personal-data',
		label: __( 'Share our personal story! 👤', 'hey-wapuu' ),
		explanation: __(
			"I'll help you export personal data if a friend asks for it! ✨",
			'hey-wapuu'
		),
		descriptions: [ 'export personal data', 'privacy export' ],
		url: 'export-personal-data.php',
	},
	{
		id: 'core/open-tools-erase-personal-data',
		label: __( 'Clear our secret diaries! 🧹', 'hey-wapuu' ),
		explanation: __(
			"I'll help you erase personal data if a friend asks to be forgotten! ✨",
			'hey-wapuu'
		),
		descriptions: [ 'erase personal data', 'privacy erase' ],
		url: 'erase-personal-data.php',
	},
	{
		id: 'core/open-updates',
		label: __( 'Get some fresh magic! 🔄', 'hey-wapuu' ),
		explanation: __(
			"I'll check if there are any new versions of WordPress or our tools! ✨🆙",
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
		label: __( 'Make everything disappear! 🪄', 'hey-wapuu' ),
		explanation: __(
			"I'll hide all the buttons so it's just you and your story! ✨🌬️",
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
		label: __( 'Turn on the spotlight! 🔦', 'hey-wapuu' ),
		explanation: __(
			"I'll highlight just the block we're working on right now! 🌟✨",
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
		label: __( 'Show our story map! 🗺️', 'hey-wapuu' ),
		explanation: __(
			"I'll show you a list of all the blocks we've used to build our page! 🗂️✨",
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
		label: __( 'Go full screen! 📺', 'hey-wapuu' ),
		explanation: __(
			"I'll make the editor fill the whole screen so we can focus! ✨",
			'hey-wapuu'
		),
		descriptions: [ 'fullscreen mode', 'max editor', 'big screen' ],
	},
	{
		id: 'core/toggle-feature-welcome-guide',
		label: __( 'See the welcome guide! 👋', 'hey-wapuu' ),
		explanation: __(
			"I'll show you the welcome guide again so you can learn the basics! ✨",
			'hey-wapuu'
		),
		descriptions: [ 'welcome guide', 'how to use editor', 'tutorial' ],
	},
	{
		id: 'core/toggle-fixed-toolbar',
		label: __( 'Stick the toolbar to the top! 📎', 'hey-wapuu' ),
		explanation: __(
			"I'll keep the toolbar at the top of the screen so it's always there! ✨",
			'hey-wapuu'
		),
		descriptions: [ 'fixed toolbar', 'top toolbar' ],
	},
	{
		id: 'core/open-preferences',
		label: __( 'Change our editor rules! ⚙️', 'hey-wapuu' ),
		explanation: __(
			"I'll open the preferences so you can change how the editor works! ✨",
			'hey-wapuu'
		),
		descriptions: [ 'editor preferences', 'change settings' ],
	},
	{
		id: 'core/open-keyboard-shortcuts',
		label: __( 'Learn magic keyboard spells! ⌨️', 'hey-wapuu' ),
		explanation: __(
			"I'll show you all the keyboard shortcuts you can use! ✨",
			'hey-wapuu'
		),
		descriptions: [ 'keyboard shortcuts', 'hotkeys' ],
	},

	// --- FUN & SYSTEM ---
	{
		id: 'core/open-dashboard',
		label: __( 'Head back to headquarters! 🖐️', 'hey-wapuu' ),
		explanation: __(
			"I'll take us back home to our main command center! 🚀✨",
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
		label: __( 'Go look at our world! 🌍', 'hey-wapuu' ),
		explanation: __(
			"I'll take us to the front so we can see what everyone else sees! 🚀✨",
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
		label: __( 'Hear a funny joke! 😂', 'hey-wapuu' ),
		explanation: __(
			'I have some super-funny jokes that will make you giggle! 😆✨',
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
		label: __( 'Learn all about me! 💛', 'hey-wapuu' ),
		explanation: __(
			'I can tell you the secret story of how I became the mascot of WordPress! ✨',
			'hey-wapuu'
		),
		descriptions: [
			'who are you',
			'what is a wapuu',
			'tell me about yourself',
		],
		action: 'about',
	},
	{
		id: 'wapuu/sing-song',
		label: __( 'Hear me sing! 🎶', 'hey-wapuu' ),
		explanation: __(
			"I've been practicing a special WordPress song just for you! 🎤✨",
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
		label: __( 'Why are you warming up? 🧠', 'hey-wapuu' ),
		explanation: __(
			'I can explain how my big brain works! ✨',
			'hey-wapuu'
		),
		descriptions: [ 'why', 'why are you warming up', 'what are you doing' ],
		action: 'why',
	},
	{
		id: 'wapuu/how-to-build',
		label: __( 'How do I build a site? 🏗️', 'hey-wapuu' ),
		explanation: __(
			'I can give you my best tips for making an awesome website! ✨',
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
		label: __( 'What else can you do? 🪄', 'hey-wapuu' ),
		explanation: __(
			'I can show you all the magic spells I know! ✨',
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
		label: __( 'How is our site doing? 🩺', 'hey-wapuu' ),
		explanation: __(
			"I'll give you a quick check-up of our magic world! ✨",
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
