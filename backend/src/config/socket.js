let ioInstance = null;

const initSocket = (server) => {
    const { Server } = require('socket.io');
    ioInstance = new Server(server, {
        cors: {
            origin: "*", 
            methods: ["GET", "POST"]
        }
    });

    ioInstance.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on('join_room', (room) => {
            socket.join(room);
            console.log(`Socket ${socket.id} joined room ${room}`);
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    return ioInstance;
};

const getIO = () => {
    if (!ioInstance) {
        throw new Error('Socket.io has not been initialized!');
    }
    return ioInstance;
};

module.exports = { initSocket, getIO };
