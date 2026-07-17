# Live Location Tracker

A lightweight Node.js web application for demonstrating live location tracking, map visualization, and screen-sharing concepts in a controlled environment. It is designed for educational demos, presentations, and local testing of real-time web-based tracking workflows.

## Overview

This project combines:
- a secure admin login flow,
- real-time GPS data reception,
- live target tracking on a map,
- and a screen-sharing demo using Socket.io and WebRTC-style signaling.

It is especially useful for showcasing how a client can send location data and how a dashboard can visualize that data in near real time.

## Features

- Live location tracking dashboard
- Map view for each tracked target
- Admin authentication with cookie-based session handling
- Real-time updates over Socket.io
- Screen-share trigger flow for demo scenarios
- Optional public access through Cloudflare Tunnel or ngrok

## Tech Stack

- Node.js + Express
- Socket.io for real-time communication
- HTML templates rendered on the server
- Leaflet-based map UI
- Cloudflared / ngrok for external tunneling

## Project Structure

```text
live-location-tracker/
├── config.js
├── package.json
├── router.js
├── server.js
├── views/
│   ├── home.html
│   ├── login.html
│   ├── map.html
│   ├── screen-share.html
│   └── weather.html
└── public/
```

## Prerequisites

Make sure you have:
- Node.js 16 or newer
- npm

## Installation

1. Clone the repository:

```bash
git clone https://github.com/_SUDIPRO/live-location-tracker.git
cd live-location-tracker
```

2. Install dependencies:

```bash
npm install
```

3. Start the app:

```bash
npm start
```

The server will run on:

```text
http://localhost:6589
```

## Usage

1. Open the login page:

```text
http://localhost:6589/login
```

2. Sign in with the default credentials:

```text
Username: admin
Password: admin
```

3. After login, you can access:
- Home dashboard: `/`
- Map view: `/map?id=<target-id>`
- Weather/location endpoint: `/weather`
- Screen share demo: `/screen-share`

## How It Works

- The weather/location endpoint receives GPS data from a client and forwards it through the server.
- The dashboard listens for incoming location updates and displays the corresponding target on a map.
- The screen-share flow allows one client to trigger a viewing session for another target client using Socket.io-based signaling.

## Configuration

The default configuration is stored in [config.js](config.js). You can adjust:
- the server port,
- the login credentials,
- and the auth token.

> For security, it is strongly recommended to change the default username/password before deploying or using the app outside a local demo environment.

## Notes

- This project is intended for demo and learning purposes.
- Public tunneling is enabled automatically when the app starts, but availability depends on your environment and network setup.
- If you plan to use it beyond localhost, review the authentication and access settings carefully.

## License

This project is distributed under the ISC license.
