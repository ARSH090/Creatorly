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
    metadata?: Record<string, any>;
}

interface CouponData {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    discountAmount: number;
    finalAmount: number;
}

interface CheckoutState {
    step: 'cart' | 'customer' | 'payment' | 'review';
    cart: CartItem[];
    customer: {
        email: string;
        name: string;
        phone?: string;
    };
    coupon: CouponData | null;
    orderBumpAccepted: boolean;

    // Actions
    setStep: (step: 'cart' | 'customer' | 'payment' | 'review') => void;
    addToCart: (item: CartItem) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    setCustomer: (info: Partial<CheckoutState['customer']>) => void;
    setCoupon: (coupon: CouponData | null) => void;
    setOrderBump: (accepted: boolean) => void;
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
            coupon: null,
            orderBumpAccepted: false,

            setStep: (step) => set({ step }),
            setCoupon: (coupon) => set({ coupon }),
            setOrderBump: (accepted) => set({ orderBumpAccepted: accepted }),

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
