import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
    id: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
    type: string;
    creator: string;
}

interface CheckoutState {
    step: 'cart' | 'customer' | 'payment' | 'review';
    cart: CartItem[];
    customer: {
        email: string;
        name: string;
        phone?: string;
    };

    // Actions
    setStep: (step: 'cart' | 'customer' | 'payment' | 'review') => void;
    addToCart: (item: CartItem) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    setCustomer: (info: Partial<CheckoutState['customer']>) => void;
    clearCart: () => void;
}

export const useCheckoutStore = create<CheckoutState>()(
    persist(
        (set) => ({
            step: 'cart',
            cart: [],
            customer: {
                email: '',
                name: '',
                phone: ''
            },

            setStep: (step) => set({ step }),

            addToCart: (item) => set((state) => {
                const existing = state.cart.find(i => i.id === item.id);
                if (existing) {
                    return {
                        cart: state.cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
                    };
                }
                return { cart: [...state.cart, { ...item, quantity: 1 }] };
            }),

            removeFromCart: (id) => set((state) => ({
                cart: state.cart.filter(i => i.id !== id)
            })),

            updateQuantity: (id, quantity) => set((state) => ({
                cart: state.cart.map(i => i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i)
            })),

            setCustomer: (info) => set((state) => ({
                customer: { ...state.customer, ...info }
            })),

            clearCart: () => set({ cart: [], step: 'cart' })
        }),
        {
            name: 'creatorly-checkout-storage'
        }
    )
);
