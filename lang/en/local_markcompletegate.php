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


/**
 * English strings.
 *
 * @package    local_markcompletegate
 * @copyright  2026 Patrick Kellogg
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['enabled'] = 'Gate the Mark as done button';
$string['enabled_desc'] = 'When an activity with manual completion has H5P on its page, its Mark as done button stays locked until the learner completes (and, when scored, passes) every H5P on the page.';
$string['ignoretypes'] = 'Content types that don\'t count';
$string['ignoretypes_desc'] = 'H5P content types that are only for reading or watching and never report completion, one machine name per line (for example H5P.Accordion). They never keep the button locked.';
$string['locked'] = 'Complete the H5P on this page first';
$string['markcompletegate:bypass'] = 'Mark activities as done without completing their H5P';
$string['message'] = 'Please complete the H5P activity on this page to enable the Mark as done button.';
$string['pluginname'] = 'Mark Complete Gate for H5P';
$string['privacy:metadata'] = 'Mark Complete Gate for H5P stores no personal data on the server. To remember which H5P a learner has already passed on a page, it keeps a small note in that learner\'s own browser (local storage).';
$string['progress'] = '{$a->done} of {$a->total} done.';
