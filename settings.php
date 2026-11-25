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
 * Admin settings.
 *
 * @package    local_markcompletegate
 * @copyright  2026 Patrick Kellogg
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_markcompletegate', get_string('pluginname', 'local_markcompletegate'));
    $settings->add(new admin_setting_configcheckbox(
        'local_markcompletegate/enabled',
        get_string('enabled', 'local_markcompletegate'),
        get_string('enabled_desc', 'local_markcompletegate'),
        1
    ));
    $settings->add(new admin_setting_configtextarea(
        'local_markcompletegate/ignoretypes',
        get_string('ignoretypes', 'local_markcompletegate'),
        get_string('ignoretypes_desc', 'local_markcompletegate'),
        "H5P.Accordion\nH5P.Collage\nH5P.Timeline\nH5P.Chart\nH5P.Table\nH5P.AdvancedText\nH5P.Image\nH5P.Video\nH5P.Audio\n" .
            "H5P.IFrameEmbed\nH5P.Twitter\nH5P.ImageSlider\nH5P.ImageHotspots\nH5P.Agamotto\nH5P.InteractiveBook",
        PARAM_TEXT
    ));
    $ADMIN->add('localplugins', $settings);
}
