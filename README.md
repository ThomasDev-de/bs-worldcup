# bsWorldcup jQuery Plugin

A lightweight and feature-rich jQuery plugin to display World Cup 2026 data using Bootstrap 4 or 5. It fetches live data from the [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json) repository. 

**Note**: This plugin currently specifically supports the **2026 World Cup**.

## Features

- **Live Data**: Fetches the latest match schedules, teams, and stadiums from GitHub.
- **Standings (Groups)**: Automatically calculates points, goals, and rankings for all groups.
- **Qualification & Playoffs**: Dedicated view for qualification matches and results.
- **Real-time Search**: Filter matches, teams, and groups by team name or FIFA code across all tabs.
- **Favorites**: Mark your favorite teams to highlight their matches throughout the application (persisted via LocalStorage).
- **Localized Display**: Support for different locales (e.g., `de-DE`, `en-US`) for date and time formatting.
- **Responsive Design**: Built with Bootstrap to look great on desktop and mobile devices.
- **Flags**: Automatically displays team flags using FlagCDN.

## Requirements

- jQuery 3.x
- Bootstrap 4.x or 5.x
- Bootstrap Icons

## Installation

Include the necessary dependencies and the plugin in your HTML:

```html
<!-- CSS -->
<link href="path/to/bootstrap.min.css" rel="stylesheet">
<link href="path/to/bootstrap-icons.css" rel="stylesheet">

<!-- JS -->
<script src="path/to/jquery.min.js"></script>
<script src="path/to/bootstrap.bundle.min.js"></script>
<script src="dist/bs-worldcup.js"></script>
```

## Usage

Initialize the plugin on a container element:

```javascript
$(document).ready(function() {
    $('#worldcup-container').bsWorldcup({
        locale: 'de-DE' // Default: 'de-DE'
    });
});
```

### Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `url` | string | `https://raw.githubusercontent.com/...` | Base URL for the JSON data. |
| `localPath` | string | `source/` | Local fallback path if GitHub is unreachable. |
| `locale` | string | `de-DE` | BCP 47 language tag for date/time formatting. |
| `bsVersion` | number | `null` | Bootstrap version (`4`, `5` or `null` for auto-detect). |

## Data Source

This project uses data provided by the [openfootball](https://github.com/openfootball) project. Specifically:
- `worldcup.json`
- `worldcup.quali_playoffs.json`
- `worldcup.stadiums.json`
- `worldcup.teams.json`

## License

MIT
