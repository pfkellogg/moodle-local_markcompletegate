<?php
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


namespace local_markcompletegate;

/**
 * Adds the gate to activity pages with manual completion.
 *
 * @package    local_markcompletegate
 * @copyright  2026 Patrick Kellogg
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class hook_callbacks {

    /**
     * Before the footer (Moodle 4.4+ hook; lib.php calls this too on older Moodle).
     *
     * @param mixed $hook The hook (unused).
     */
    public static function before_footer($hook = null): void {
        global $PAGE;
        $config = self::config();
        if ($config === null) {
            return;
        }
        $PAGE->requires->js_init_code('window.localMarkcompletegate = ' . json_encode($config) . ';');
        $PAGE->requires->js(new \moodle_url('/local/markcompletegate/js/gate.js',
            ['v' => get_config('local_markcompletegate', 'version')]));
    }

    /**
     * The gate's settings for this page, or null when this page isn't gated.
     *
     * @return array|null
     */
    public static function config(): ?array {
        global $PAGE, $USER;
        if ((string) get_config('local_markcompletegate', 'enabled') === '0') {
            return null; // Turned off in the settings (not yet saved = on).
        }
        if (during_initial_install() || !isloggedin() || isguestuser()) {
            return null;
        }
        try {
            $cm = $PAGE->cm;
        } catch (\Throwable $e) {
            return null;
        }
        if (!$cm || $PAGE->context->contextlevel != CONTEXT_MODULE) {
            return null;
        }
        $completion = new \completion_info($PAGE->course);
        if (!$completion->is_enabled($cm) || $cm->completion != COMPLETION_TRACKING_MANUAL) {
            return null;
        }
        if (has_capability('local/markcompletegate:bypass', $PAGE->context)) {
            return null;
        }
        $data = $completion->get_data($cm, false, $USER->id);
        if ($data->completionstate != COMPLETION_INCOMPLETE) {
            return null;
        }
        $ignore = preg_split('/[\s,]+/', (string) get_config('local_markcompletegate', 'ignoretypes'), -1, PREG_SPLIT_NO_EMPTY);
        $a = (object) ['done' => '{done}', 'total' => '{total}'];
        return [
            'cmid' => (int) $cm->id,
            'user' => (int) $USER->id,
            'ignore' => array_values($ignore),
            'message' => get_string('message', 'local_markcompletegate'),
            'locked' => get_string('locked', 'local_markcompletegate'),
            'progress' => get_string('progress', 'local_markcompletegate', $a),
        ];
    }
}
