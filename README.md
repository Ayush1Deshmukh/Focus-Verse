# Focus-Verse
# Focus Rewards Blocker 
![Focus Rewards Banner](https://img.shields.io/badge/Focus%20Rewards-Productivity%20Tool-blue)
[![Summer of CodeFest'25](https://img.shields.io/badge/Summer%20of%20CodeFest'25-Hackathon-orange)](https://summerofcodefest.com)
[![GSoC Innovators Club](https://img.shields.io/badge/GSoC%20Innovators%20Club-Project-green)](https://gsoc-innovators.club)

## Overview

This is the Chrome extension component of the Focus Rewards project. It blocks distracting websites during study sessions and integrates with the Focus Rewards web application.

## Features

- Blocks user-specified websites during focus sessions
- Automatically unblocks websites when sessions end
- Displays a friendly "blocked" page with session information
- Communicates with the Focus Rewards web application

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable Developer mode (toggle in the top-right corner)
3. Click "Load unpacked" and select this folder
4. The extension icon should appear in your browser toolbar

## Usage

This extension works in conjunction with the Focus Rewards web application. To use:

1. Visit the Focus Rewards web app at [http://localhost:3000](http://localhost:3000) or the deployed version
2. Set up a focus session, selecting websites to block
3. Start your session
4. The extension will block the selected websites for the duration of your session

## Project Context

This extension is part of a project developed for the **Summer of CodeFest'25** hackathon organized by the **GSoC Innovators Club**. It addresses the common challenge of digital distractions during study sessions and provides a solution to maintain focus.

## Repository

Find the simpler version of the these in the extension : [https://github.com/your-username/focus-rewards](https://github.com/your-username/focus-rewards)

## Main Components

- `background.js`: The main service worker that handles website blocking
- `content-script.js`: Communicates between the web app and extension
- `blocked.html`: The page displayed when a blocked site is accessed
- `popup.html`: The extension popup interface

## License

This project is licensed under the MIT License - see the LICENSE file for details.
