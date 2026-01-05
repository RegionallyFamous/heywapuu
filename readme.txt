=== Hey Wapuu ===
Contributors: regionallyfamous
Tags: assistant, chat, command palette, nlu, search
Requires at least: 6.3
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.8.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A natural language chat assistant for WordPress. Ask Wapuu to help you navigate and manage your site!

== Description ==

Hey Wapuu is a conversational assistant for the WordPress admin. Instead of searching through menus or the command palette, you can simply chat with Wapuu in plain English.

Powered by Transformers.js, Hey Wapuu uses a small, local machine learning model (all-MiniLM-L6-v2) to understand your intent directly in your browser. No data leaves your server, and no external APIs are required.

== Installation ==

1. Upload the `hey-wapuu` folder to the `/wp-content/plugins/` directory.
2. Activate the plugin through the 'Plugins' menu in WordPress.
3. Click the Wapuu chat bubble in the bottom right corner of your admin screen to start chatting!

== Frequently Asked Questions ==

= Does this use an external AI API? =
No! All processing happens locally in your browser using Transformers.js.

= Which WordPress versions are supported? =
WordPress 6.3 and higher are required for full compatibility with the Command Palette API.

== Changelog ==

= 1.8.0 =
* Monolith Refactor: Completely overhauled the plugin architecture. The 1,800+ line monolith has been broken down into modular hooks and components for better maintainability and future-proofing.
* Modular Architecture: Introduced `src/hooks/`, `src/components/`, and `src/utils/` to separate concerns.
* Stability Fixes: Improved hook dependency management and fixed all linter warnings.

= 1.7.1 =
* Professional Tone: Refactored all text to be more concise and professional.
* Emoji Removal: Removed all emojis from the interface and AI responses.
* Confetti Removal: Removed the celebration confetti effect.
* UI Cleanup: Simplified action cards and icons.

= 1.7.0 =
* UI State Machine: Implemented a robust state machine for UI modes (IDLE, SEARCHING, RESULTS, THINKING).
* Persistent Button Tray: Decoupled action buttons from text input to ensure they remain visible until an action is taken.
* Structural Stability: Major refactoring of the main component to prevent state collisions.

= 1.6.9 =
* FIXED: Corrected author name to Regionally Famous.
* IMPROVED: UI layout for suggestion buttons - moved to a fixed tray for better visibility.
* IMPROVED: AI query logic to prevent redundant message generation during live search.
* FIXED: Premature AI inference while typing.

= 1.6.2 =
* FIXED: Console error when audio is blocked by the browser.
* FIXED: Resource hinting warnings by updating preload 'as' types.
* IMPROVED: Browser compatibility for AI model preloading.

= 1.6.0 =
* NEW: AI Hibernation Mode - The AI worker now releases its memory after 5 minutes of inactivity to keep your browser fast.
* NEW: Robust Security Hardening - Enhanced XSS sanitization and URL validation for dynamic commands.
* IMPROVED: Performance Caching - Dynamic command scraping now uses shallow comparison to prevent unnecessary re-renders.
* IMPROVED: Cleaned up sanitizer logic to better handle AI-generated bold text.

= 1.5.0 =
* NEW: Omni-Brain Sidebar Learning - Wapuu now scans your admin menu to learn about custom plugins and pages automatically!
* NEW: Live "As-You-Type" Results - See AI matches update in real-time as you type your query.
* NEW: Debounced Neural Triage - Performance optimization for live search to save battery and keep the UI smooth.
* IMPROVED: Dynamic Command Prioritization - Smart ranking of exact vs. semantic matches.

= 1.4.0 =
* NEW: Multi-Tab Synchronization - Use BroadcastChannel and WebLocks to sync AI status across all open tabs.
* NEW: Visual "I'm Ready!" Wiggle - Wapuu gives a little happy wiggle when the model is fully loaded.
* NEW: Smart Memory Purging - Automatically manages session storage to keep the browser fast.

= 1.3.0 =
* IMPROVED: "Enterprise Core" Resilience - Added exponential backoff for model downloads.
* IMPROVED: Sub-pixel animation using requestAnimationFrame for the typewriter effect.
* IMPROVED: Hardware-conscious threading based on CPU core count.

= 1.2.0 =
* NEW: Wow Factor - Added Typewriter effect, Celebration Confetti, and Mood Expressions.
* NEW: Action Cards - Contextual cards for site health, drafts, and updates.

= 1.1.0 =
* Added Typewriter effect for AI responses.
* Introduced Rich Action Cards for proactive suggestions (Drafts, Updates, Media).
* Implemented "Screen-Aware" Intent Chaining.
* Added hardware-accelerated "Glow" effects to the UI.
* Optimized memory usage for chat history.

= 1.0.4 =
* Speed optimizations: Resource hinting and preloading.
* Efficiency: Enabled Wasm SIMD and multi-threading.
* Security: Hardened model loading and worker security.

= 1.0.3 =
* Fixed spacing in initial greeting messages.

= 1.0.2 =
* Optimized model for mobile devices (switched to quantized version).
* Added visual loading progress bar.
* Improved keyboard shortcuts (Alt+W/Option+W) and focus management.
* Enhanced cache-busting for development environments.
* Refactored worker initialization for better reliability.

= 1.0.0 =
* Initial release. Conversational chat interface with local NLU.
