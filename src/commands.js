/**
 * Hey Wapuu Conversational Registry - The "Wonder" Edition
 */

export const commands = [
	// --- POSTS & PAGES ---
	{
		id: 'core/add-new-post',
		label: 'Start a new storybook! ✍️',
		explanation: 'I can open a fresh page so we can start writing our next big adventure! 📖✨',
		descriptions: ['write a story', 'make a new blog post', 'create a post', 'new post', 'tell a secret', 'new article', 'share a thought', 'start a post'],
		url: 'post-new.php'
	},
	{
		id: 'core/add-new-page',
		label: 'Build a new secret hideout! 🏠',
		explanation: 'I\'ll take us to the page builder so we can create a whole new place for people to visit! 💎✨',
		descriptions: ['create a new page', 'make a static page', 'new about page', 'new contact page', 'add a page'],
		url: 'post-new.php?post_type=page'
	},
	{
		id: 'core/manage-posts',
		label: 'Visit our library of stories! 📝',
		explanation: 'I\'ll show you every single thing we\'ve ever written together. It\'s a big collection! 🗂️📚',
		descriptions: ['show all posts', 'view post list', 'manage my articles', 'all my stories'],
		url: 'edit.php'
	},

	// --- MEDIA ---
	{
		id: 'core/open-media-library',
		label: 'Open our magic treasure chest! 🖼️',
		explanation: 'I\'ll show you all our pictures, videos, and secrets we\'ve tucked away! 💎✨',
		descriptions: ['show pictures', 'find images', 'open gallery', 'uploaded files', 'photos library'],
		url: 'upload.php'
	},
	{
		id: 'core/add-new-media',
		label: 'Add something new to the chest! 📤',
		explanation: 'I can help you upload a new photo or a cool video to our collection! 📸✨',
		descriptions: ['upload image', 'add photo', 'new video', 'upload file', 'add media'],
		url: 'media-new.php'
	},

	// --- APPEARANCE ---
	{
		id: 'core/open-appearance-themes',
		label: 'Pick out a new outfit! 👗',
		explanation: 'I can show you all the different ways we can dress up our site today! 🎨✨',
		descriptions: ['change look', 'find design', 'new theme', 'manage themes', 'appearance'],
		url: 'themes.php'
	},
	{
		id: 'core/open-site-editor',
		label: 'Go to the master workshop! 🛠️',
		explanation: 'I\'ll take you to the big editor where we can change how everything looks at once! 🏛️✨',
		descriptions: ['edit site', 'change layout', 'full site editing', 'open editor', 'customize theme'],
		url: 'site-editor.php'
	},
	{
		id: 'core/open-appearance-menus',
		label: 'Fix our treasure map! 🗺️',
		explanation: 'I\'ll help you change the menus so our friends always find their way! 🧭✨',
		descriptions: ['change menu', 'edit navigation', 'fix links', 'menu settings'],
		url: 'nav-menus.php'
	},

	// --- USERS & FRIENDS ---
	{
		id: 'core/manage-users',
		label: 'See all our teammates! 👥',
		explanation: 'I\'ll show you everyone who is helping us build this awesome site! 🤝✨',
		descriptions: ['show users', 'view team', 'manage people', 'who is here'],
		url: 'users.php'
	},
	{
		id: 'core/add-new-user',
		label: 'Invite a new friend! ➕',
		explanation: 'I can help you add someone new to our team so they can help us too! 👤✨',
		descriptions: ['add user', 'new member', 'invite person', 'create account'],
		url: 'user-new.php'
	},
	{
		id: 'core/manage-comments',
		label: 'Read our mail from friends! 💬',
		explanation: 'I\'ll take us to see all the nice things people are saying about our work! 💖✨',
		descriptions: ['show comments', 'see feedback', 'read messages', 'who commented'],
		url: 'edit-comments.php'
	},

	// --- TOOLS & PLUGINS ---
	{
		id: 'core/open-plugins',
		label: 'Get some new superpowers! 🦸‍♂️',
		explanation: 'I\'ll show you all the extra tools we can plug in to make our site even better! ⚡✨',
		descriptions: ['add features', 'manage extensions', 'installed plugins', 'new tools'],
		url: 'plugins.php'
	},
	{
		id: 'core/open-settings-general',
		label: 'Change our site\'s name! 🏷️',
		explanation: 'I can take you to the main control room to change the basics! ⚙️✨',
		descriptions: ['site title', 'change description', 'general settings', 'change name'],
		url: 'options-general.php'
	},

	// --- FUN & SYSTEM ---
	{
		id: 'core/open-dashboard',
		label: 'Head back to headquarters! 🖐️',
		explanation: 'I\'ll take us back home to our main command center! 🚀✨',
		descriptions: ['go home', 'main menu', 'wp-admin', 'start page', 'back to start'],
		url: 'index.php'
	},
	{
		id: 'core/view-site',
		label: 'Go look at our world! 🌍',
		explanation: 'I\'ll take us to the front so we can see what everyone else sees! 🚀✨',
		descriptions: ['show my website', 'visit site', 'preview live', 'how does it look', 'open front end'],
		url: '/'
	},
	{
		id: 'wapuu/tell-joke',
		label: 'Hear a funny joke! 😂',
		explanation: 'I have some super-funny jokes that will make you giggle! 😆✨',
		descriptions: ['tell me a joke', 'make me laugh', 'say something funny'],
		action: 'joke'
	},
	{
		id: 'wapuu/who-are-you',
		label: 'Learn all about me! 💛',
		explanation: 'I can tell you the secret story of how I became the mascot of WordPress! ✨',
		descriptions: ['who are you', 'what is a wapuu', 'tell me about yourself'],
		action: 'about'
	},
	{
		id: 'wapuu/sing-song',
		label: 'Hear me sing! 🎶',
		explanation: 'I\'ve been practicing a special WordPress song just for you! 🎤✨',
		descriptions: ['sing a song', 'can you sing', 'make music', 'sing for me'],
		action: 'song'
	},
	{
		id: 'wapuu/why-warm-up',
		label: 'Why are you warming up? 🧠',
		explanation: 'I can explain how my big brain works! ✨',
		descriptions: ['why', 'why are you warming up', 'what are you doing'],
		action: 'why'
	}
];
