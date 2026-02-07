# Color Cloud Console

Assign colors to cloud provider projects so you can tell your environments apart at a glance.

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg)](https://github.com/RichardLitt/standard-readme)
[![Manifest v3](https://img.shields.io/badge/manifest-v3-blue)]()

A browser extension that colors the top bar of your cloud provider's web console based on the active project. Quickly spot which environment you're working in — no more accidentally running commands against production.

Currently supports Google Cloud Platform. AWS and Azure support is planned.

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Background

Cloud consoles for different projects look identical. It's easy to lose track of which environment you're in, especially when switching between development, staging, and production. This extension adds a persistent color band to the console top bar so each project is visually distinct.

## Install

### Firefox (AMO)

Coming soon.

### Firefox (from source)

```sh
git clone https://github.com/<your-username>/color-cloud-console.git
```

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `manifest.json` from the cloned directory

### Development

```sh
npm install
npm run lint          # ESLint
npm run format        # Prettier (auto-fix)
npm run format:check  # Prettier (check only)
```

## Usage

1. Navigate to a GCP project in your browser
2. Click the extension icon in the toolbar
3. Pick a color from the preset swatches or open the full picker
4. The top bar updates immediately and the color persists across sessions

Click **Clear** to remove a color assignment. Click **Settings** to see all configured projects.

## Contributing

PRs welcome. Please run `npm run lint` and `npm run format:check` before submitting.

## License

[MIT](LICENSE)
