<?php

/**
 * Plugin Name: React Articles Display
 * Description: Menampilkan daftar artikel React dari Vercel dengan iframe responsif
 * Version: 1.0.0
 * Author: Fail Amir
 * Author URI: https://sozo.treonstudio.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: react-articles-display
 *
 * @package React_Articles_Display
 */

// If this file is called directly, abort.
if (!defined('ABSPATH')) {
    exit;
}

// Ensure WordPress environment is loaded
if (!function_exists('add_action')) {
    require_once ABSPATH . 'wp-admin/includes/plugin.php';
}

/**
 * Shortcode untuk menampilkan React Articles
 * 
 * Parameter:
 * - width: Lebar container (contoh: 100%, 800px)
 * - height: Tinggi iframe (contoh: 800px)
 * - theme: Tema tampilan (light/dark)
 * - category: Filter kategori (opsional)
 * 
 * Contoh penggunaan:
 * [react_articles width="100%" height="800px" theme="light" category="kesehatan"]
 */
function react_articles_shortcode($atts)
{
    // Atribut default
    $atts = shortcode_atts(array(
        'width' => '100%',
        'height' => '600px',
        'expanded_height' => '1200px',
        'theme' => 'light',
        'category' => ''
    ), $atts, 'react_articles');

    // URL ke aplikasi React di Vercel
    $vercel_url = 'https://articles-irfan.vercel.app';

    // Generate unique ID for the iframe
    $iframe_id = 'react-articles-iframe-' . uniqid();

    // Parameter URL
    $params = array(
        'embed' => 'true',
        'theme' => in_array(strtolower($atts['theme']), ['light', 'dark']) ? strtolower($atts['theme']) : 'light'
    );

    // Tambahkan kategori jika disediakan
    if (!empty($atts['category'])) {
        $params['category'] = sanitize_title($atts['category']);
    }

    // Bangun URL dengan parameter
    $iframe_src = add_query_arg($params, $vercel_url);

    // Output HTML
    ob_start();
?>
    <div class="react-articles-wrapper" style="width: <?php echo esc_attr($atts['width']); ?>; max-width: 100%; margin: 20px auto;">
        <div class="react-articles-container"
            style="position: relative; overflow: hidden; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <iframe
                id="<?php echo esc_attr($iframe_id); ?>"
                src="<?php echo esc_url($iframe_src); ?>"
                style="width: 100%; height: <?php echo esc_attr($atts['height']); ?>; border: 0; transition: height 0.3s ease;"
                allowfullscreen
                loading="lazy"
                title="Daftar Artikel"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"></iframe>
            <div class="react-articles-controls" style="text-align: center; padding: 10px 0; background: #f8f9fa; border-top: 1px solid #e5e7eb;">
                <button class="expand-iframe-btn"
                    style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 500;"
                    data-iframe-id="<?php echo esc_attr($iframe_id); ?>"
                    data-collapsed-height="<?php echo esc_attr($atts['height']); ?>"
                    data-expanded-height="<?php echo esc_attr($atts['expanded_height']); ?>">
                    Lihat Semua
                </button>
            </div>
        </div>
        <?php if (current_user_can('edit_posts')): ?>
            <div style="text-align: center; margin-top: 10px; font-size: 12px; color: #666;">
                <small>Shortcode: <code>[react_articles height="<?php echo esc_attr($atts['height']); ?>" theme="<?php echo esc_attr($atts['theme']); ?>"]</code></small>
            </div>
        <?php endif; ?>
    </div>
<?php
    return ob_get_clean();
}
add_shortcode('react_articles', 'react_articles_shortcode');

/**
 * Menambahkan styles untuk tampilan yang lebih baik
 */
function react_articles_enqueue_styles()
{
    // Enqueue the JavaScript file
    wp_enqueue_script(
        'react-articles-js',
        plugins_url('assets/js/expand-iframe.js', __FILE__),
        array(),
        '1.0.0',
        true
    );

    $css = '
    <style>
        .react-articles-wrapper {
            clear: both;
            margin: 25px 0;
        }
        .react-articles-container {
            background: #f8f9fa;
            transition: all 0.3s ease;
            border-radius: 12px;
            overflow: hidden;
        }
        .react-articles-container:hover {
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .react-articles-controls {
            text-align: center;
            padding: 12px 0;
            background: #f8f9fa;
            border-top: 1px solid #e5e7eb;
        }
        .expand-iframe-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 8px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            font-size: 14px;
            transition: all 0.2s ease;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .expand-iframe-btn:hover {
            background: #2563eb;
            transform: translateY(-1px);
        }
        .expand-iframe-btn:active {
            transform: translateY(0);
        }
        .expand-iframe-btn.expanded {
            background: #ef4444;
        }
        .expand-iframe-btn.expanded:hover {
            background: #dc2626;
        }
        @media (max-width: 782px) {
            .react-articles-container {
                margin: 10px 0;
                border-radius: 8px;
            }
            .expand-iframe-btn {
                padding: 10px 24px;
                font-size: 15px;
                width: calc(100% - 40px);
                max-width: 280px;
                margin: 0 auto;
            }
        }
        /* Loading state */
        .react-articles-container.loading {
            background: #f3f4f6 url("data:image/svg+xml,%3Csvg%20class%3D%27animate-spin%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20fill%3D%27none%27%20viewBox%3D%270%200%2024%2024%27%3E%3Ccircle%20cx%3D%2712%27%20cy%3D%2712%27%20r%3D%2710%27%20stroke%3D%27%23e5e7eb%27%20stroke-width%3D%274%27%3E%3C%2Fcircle%3E%3Cpath%20fill%3D%27%2324a1ff%27%20d%3D%27M4%2012a8%208%200%20018-8V0C5.373%200%200%205.373%200%2012h4zm2%205.291A7.962%207.962%200%20014%2012H0c0%203.042%201.135%205.824%203%207.938l3-2.647z%27%3E%3C%2Fpath%3E%3C%2Fsvg%3E") no-repeat center;
            background-size: 40px;
        }
    </style>';
    echo $css;
}
add_action('wp_footer', 'react_articles_enqueue_styles');

/**
 * Tambahkan link settings di halaman plugin
 */
function react_articles_add_action_links($links)
{
    $settings_link = '<a href="' . admin_url('options-general.php?page=react-articles-settings') . '">' . __('Settings') . '</a>';
    array_unshift($links, $settings_link);
    return $links;
}
$plugin = plugin_basename(__FILE__);
add_filter("plugin_action_links_$plugin", 'react_articles_add_action_links');

/**
 * Tambahkan halaman settings
 */
function react_articles_add_admin_menu()
{
    add_options_page(
        'React Articles Settings',
        'React Articles',
        'manage_options',
        'react-articles-settings',
        'react_articles_options_page'
    );
}
add_action('admin_menu', 'react_articles_add_admin_menu');

function react_articles_options_page()
{
?>
    <div class="wrap">
        <h1>React Articles Settings</h1>
        <form method="post" action="options.php">
            <?php
            settings_fields('react_articles_options');
            do_settings_sections('react-articles-settings');
            submit_button();
            ?>
        </form>
        <div class="card">
            <h2>Shortcode Examples</h2>
            <p>Basic usage: <code>[react_articles]</code></p>
            <p>With custom height: <code>[react_articles height="600px"]</code></p>
            <p>With dark theme: <code>[react_articles theme="dark"]</code></p>
            <p>Filter by category: <code>[react_articles category="kesehatan"]</code></p>
        </div>
    </div>
<?php
}

function react_articles_settings_init()
{
    register_setting('react_articles_options', 'react_articles_options');

    add_settings_section(
        'react_articles_main',
        'General Settings',
        'react_articles_section_text',
        'react-articles-settings'
    );

    add_settings_field(
        'react_articles_default_height',
        'Default Height',
        'react_articles_height_input',
        'react-articles-settings',
        'react_articles_main'
    );

    add_settings_field(
        'react_articles_default_theme',
        'Default Theme',
        'react_articles_theme_input',
        'react-articles-settings',
        'react_articles_main'
    );
}
add_action('admin_init', 'react_articles_settings_init');

function react_articles_section_text()
{
    echo '<p>Configure the default settings for the React Articles display.</p>';
}

function react_articles_height_input()
{
    $options = get_option('react_articles_options');
    echo "<input id='react_articles_default_height' name='react_articles_options[height]' size='40' type='text' value='{$options['height']}' placeholder='800px' />";
}

function react_articles_theme_input()
{
    $options = get_option('react_articles_options');
    $current = isset($options['theme']) ? $options['theme'] : 'light';
?>
    <select id="react_articles_default_theme" name="react_articles_options[theme]">
        <option value="light" <?php selected($current, 'light'); ?>>Light</option>
        <option value="dark" <?php selected($current, 'dark'); ?>>Dark</option>
    </select>
<?php
}

/**
 * Activation hook
 */
function react_articles_activate()
{
    // Set default options
    if (false === get_option('react_articles_options')) {
        $default_options = array(
            'height' => '800px',
            'theme' => 'light'
        );
        add_option('react_articles_options', $default_options);
    }
}
register_activation_hook(__FILE__, 'react_articles_activate');

/**
 * Deactivation hook
 */
function react_articles_deactivate()
{
    // Cleanup jika diperlukan
}
register_deactivation_hook(__FILE__, 'react_articles_deactivate');
