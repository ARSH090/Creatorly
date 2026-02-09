'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';

export const useCartSocket = (cartId: string, onUpdate: (data: any) => void) => {
    useEffect(() => {
        if (!cartId) return;

        // In a real app, this would be the actual websocket server URL
        // For now, we'll just mock the connection or use a relative path if supported
        const socket = io({ path: '/api/socket' });

        socket.on('connect', () => {
            console.log('Connected to cart socket');
            socket.emit('join-cart', cartId);
        });

        socket.on('cart-updated', (data: any) => {
            console.log('Cart updated via socket:', data);
            onUpdate(data);
        });

        return () => {
            socket.disconnect();
        };
    }, [cartId, onUpdate]);
};
