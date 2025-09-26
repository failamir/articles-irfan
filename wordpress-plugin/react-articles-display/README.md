# React Articles Display WordPress Plugin

A WordPress plugin that displays a list of React articles in an expandable iframe.

## Features

- Responsive iframe that adapts to your theme
- Expand/collapse functionality with smooth animations
- Light and dark theme support
- Category filtering
- Admin-friendly shortcode generator

## Installation

1. Upload the `react-articles-display` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Use the `[react_articles]` shortcode in your posts or pages

## Usage

Basic usage:
```
[react_articles]
```

With custom parameters:
```
[react_articles 
    width="100%" 
    height="600px" 
    expanded_height="1200px" 
    theme="light" 
    category="health"]
```

### Parameters

- `width`: (string) Width of the container (default: "100%")
- `height`: (string) Initial height of the iframe (default: "600px")
- `expanded_height`: (string) Height when expanded (default: "1200px")
- `theme`: (string) Color theme - "light" or "dark" (default: "light")
- `category`: (string) Filter articles by category (optional)

## Requirements

- WordPress 5.0 or higher
- PHP 7.4 or higher

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

GPL v2 or later

## Author

Fail Amir - [Website](https://sozo.treonstudio.com)
