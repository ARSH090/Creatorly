import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

/**
 * Socket.io Server logic for Creatorly
 * Handles real-time collaboration: cursors, presence, and live updates.
 */
export const initSocketServer = (httpServer: NetServer) => {
    const io = new SocketIOServer(httpServer, {
        path: '/api/socket',
        addTrailingSlash: false,
        cors: {
            origin: '*', // In production, restrict to your domain
            methods: ['GET', 'POST']
        }
    });

    console.log('🔌 Socket.io Server Initialized');

    // Store presence: contentId -> Set of users
    const presenceMap = new Map<string, Set<string>>();

    io.on('connection', (socket) => {
        console.log(`👤 User connected: ${socket.id}`);

        // Join a content editing session
        socket.on('join_content', ({ contentId, userId, username }) => {
            socket.join(`content:${contentId}`);

            if (!presenceMap.has(contentId)) {
                presenceMap.set(contentId, new Set());
            }
            presenceMap.get(contentId)?.add(username);

            // Notify everyone in the room about the new user
            io.to(`content:${contentId}`).emit('presence_update', {
                users: Array.from(presenceMap.get(contentId) || [])
            });

            console.log(`📝 User ${username} joined content ${contentId}`);
        });

        // Handle cursor movement
        socket.on('cursor_move', ({ contentId, userId, username, position }) => {
            // Broadcast to everyone else in the room
            socket.to(`content:${contentId}`).emit('cursor_update', {
                userId,
                username,
                position
            });
        });

        // Handle live typing (presence only, actual save is separate)
        socket.on('content_typing', ({ contentId, userId, username }) => {
            socket.to(`content:${contentId}`).emit('user_typing', { username });
        });

        // Handle disconnection
        socket.on('disconnecting', () => {
            for (const room of socket.rooms) {
                if (room.startsWith('content:')) {
                    const contentId = room.split(':')[1];
                    // Logic to remove user from presenceMap would go here
                    // Requires tracking socket -> username mapping
                }
            }
        });

        socket.on('disconnect', () => {
            console.log(`🔌 User disconnected: ${socket.id}`);
        });
    });

    return io;
};
