// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty
// of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Moodle. If not, see
// <https://www.gnu.org/licenses/>.

/**
 * Mark Complete Gate for H5P: on an activity with manual completion, the Mark as done button stays locked until every
 * H5P on the page is completed (and passed, when scored). Completion comes from H5P's own xAPI events, read inside
 * Moodle's H5P frames (/h5p/embed.php, same site). Passed items are remembered in the learner's browser.
 *
 * @copyright  2026 Patrick Kellogg
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
(function() {
    'use strict';

    // The settings come from Moodle's page-end init code, which can run after this file: wait for them.
    var waited = 0;
    (function boot() {
        if (window.localMarkcompletegate) {
            gate(window.localMarkcompletegate);
        } else if (++waited < 100) {
            setTimeout(boot, 100);
        }
    })();

    /**
     * The gate.
     *
     * @param {object} CFG The settings from Moodle.
     */
    function gate(CFG) {
        var SUB_ID = 'http://h5p.org/x-api/h5p-subContentId';
        var STORE = 'local_markcompletegate:' + CFG.user + ':' + CFG.cmid;
        var needed = {}; // Frame key -> true while it still has to be done.
        var done = {};
        var message = null;

        try {
            done = JSON.parse(window.localStorage.getItem(STORE) || '{}') || {};
        } catch (e) {
            done = {};
        }

        /**
         * The Mark as done buttons of this activity (not yet done).
         *
         * @returns {HTMLElement[]}
         */
        function buttons() {
            var sel = '[data-action="toggle-manual-completion"][data-cmid="' + CFG.cmid + '"]';
            return Array.prototype.slice.call(document.querySelectorAll(sel)).filter(function(b) {
                return (b.getAttribute('data-toggletype') || '').indexOf('undo') === -1;
            });
        }

        /**
         * Which H5P still have to be done.
         *
         * @returns {string[]}
         */
        function missing() {
            return Object.keys(needed).filter(function(k) {
                return needed[k] && !done[k];
            });
        }

        /**
         * Lock or unlock the buttons, and show the message while locked.
         */
        function update() {
            var left = missing();
            var total = Object.keys(needed).filter(function(k) {
                return needed[k];
            }).length;
            var locked = left.length > 0;
            var list = buttons();
            list.forEach(function(b) {
                b.disabled = locked;
                b.setAttribute('aria-disabled', locked ? 'true' : 'false');
                b.title = locked ? CFG.locked : '';
            });
            if (!list.length) {
                return;
            }
            if (!message) {
                message = document.createElement('div');
                message.className = 'local-markcompletegate-message alert alert-info mt-2';
                message.setAttribute('role', 'status');
                message.setAttribute('aria-live', 'polite');
            }
            var anchor = list[0].closest('[data-region="activity-information"]') || list[0].parentNode;
            if (message.parentNode !== anchor.parentNode) {
                anchor.parentNode.insertBefore(message, anchor.nextSibling);
            }
            message.hidden = !locked;
            var text = CFG.message;
            if (locked && total > 1) {
                text += ' ' + CFG.progress.replace('{done}', String(total - left.length)).replace('{total}', String(total));
            }
            message.textContent = text;
        }

        /**
         * Remember a passed H5P.
         *
         * @param {string} key
         */
        function passed(key) {
            if (done[key]) {
                return;
            }
            done[key] = true;
            try {
                window.localStorage.setItem(STORE, JSON.stringify(done));
            } catch (e) {
                // Private browsing: remembered for this visit only.
            }
            update();
        }

        /**
         * Whether an xAPI statement says the activity itself was completed (and passed, when scored).
         *
         * @param {object} s The statement.
         * @returns {boolean}
         */
        function isPass(s) {
            if (!s || !s.object || !s.verb) {
                return false;
            }
            var ext = (s.object.definition && s.object.definition.extensions) || {};
            if (ext[SUB_ID]) {
                return false; // A question inside the activity: wait for the activity itself.
            }
            var verb = String(s.verb.id || '').split('/').pop();
            if (verb !== 'completed' && verb !== 'answered') {
                return false;
            }
            var r = s.result || {};
            return r.success === true || (r.success === undefined && (verb === 'completed' || r.completion === true));
        }

        /**
         * Watch one H5P frame.
         *
         * @param {HTMLIFrameElement} frame
         * @param {number} index
         */
        function watch(frame, index) {
            var key;
            try {
                key = new URL(frame.src, window.location.href).searchParams.get('url') || frame.src;
            } catch (e) {
                key = frame.src || String(index);
            }
            if (Object.prototype.hasOwnProperty.call(needed, key)) {
                key += '#' + index;
            }
            needed[key] = true;
            update();
            var tries = 0;
            (function listen() {
                var w = null;
                try {
                    w = frame.contentWindow;
                } catch (e) {
                    w = null;
                }
                var h5p = w && w.H5P;
                var integ = w && w.H5PIntegration;
                var secured = w && w.dvpSecureH5P;
                if (((h5p && h5p.externalDispatcher) || secured) && integ && integ.contents) {
                    var lib = '';
                    Object.keys(integ.contents).forEach(function(c) {
                        lib = lib || String(integ.contents[c].library || '').split(' ')[0];
                    });
                    if (lib && CFG.ignore.indexOf(lib) !== -1) {
                        needed[key] = false; // Only for reading or watching: it never reports completion.
                        update();
                        return;
                    }
                    if (h5p && h5p.externalDispatcher) {
                        h5p.externalDispatcher.on('xAPI', function(event) {
                            if (isPass(event && event.data && event.data.statement)) {
                                passed(key);
                            }
                        });
                    }
                    // Secure Answers for H5P checks the answers on the server and says so with its own event.
                    w.addEventListener('dvp-secure-h5p-completed', function() {
                        passed(key);
                    });
                    return;
                }
                if (++tries < 240) {
                    setTimeout(listen, 250);
                } else {
                    needed[key] = false; // H5P never loaded here: don't leave the learner stuck.
                    update();
                }
            })();
        }

        /**
         * Start: find the H5P frames on the page.
         */
        function start() {
            var frames = Array.prototype.slice.call(document.querySelectorAll('iframe[src*="/h5p/embed.php"]'));
            if (!frames.length) {
                return; // No H5P here: leave the page alone.
            }
            frames.forEach(watch);
            // Moodle redraws the button after some actions: keep the lock on the new one.
            new MutationObserver(function() {
                if (missing().length && buttons().some(function(b) {
                    return !b.disabled;
                })) {
                    update();
                }
            }).observe(document.body, {childList: true, subtree: true});
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', start);
        } else {
            start();
        }
    }
})();
