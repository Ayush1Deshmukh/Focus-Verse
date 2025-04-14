# Website Blocker Chrome Extension

A simple Chrome extension to block distracting websites and improve your productivity.

## Features

- Block any website by adding it to your blocked list
- Easy-to-use interface
- Shows a friendly blocking page when you try to access a blocked site
- Easily remove websites from the blocked list when needed

## Installation

1. Download or clone this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" and select the directory containing the extension files
5. The Website Blocker extension should now be installed and visible in your extensions list

## Usage

1. Click on the Website Blocker icon in your Chrome toolbar to open the popup
2. Enter a website URL you want to block (e.g., facebook.com) and click "Add" or press Enter
3. The website will be added to your blocked list
4. If you try to access a blocked website, you'll be redirected to a blocking page
5. To remove a website from the blocked list, click the "Remove" button next to it in the popup

## Note

- You need to enter the domain without "http://" or "https://" (these will be removed automatically)
- The extension will also block subdomains of blocked domains (e.g., if you block "facebook.com", "www.facebook.com" will also be blocked)

## License

This project is available under the MIT License.