import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    cartItemId: string; // Unique ID for the line item (uuid)
    id: string; // Product ID
    variantId?: string;
    variantTitle?: string;
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
    step: 'cart' | 'customer' | 'payment' | 'review' | 'upsell';
    cart: CartItem[];
    customer: {
        email: string;
        name: string;
        phone?: string;
    };
    coupon: CouponData | null;
    orderBumpAccepted: boolean;
    activeBumps: any[];
    upsellOffer: any | null;

    // Actions
    setStep: (step: 'cart' | 'customer' | 'payment' | 'review' | 'upsell') => void;
    addToCart: (item: Omit<CartItem, 'cartItemId'>) => void;
    removeFromCart: (cartItemId: string) => void;
    updateQuantity: (cartItemId: string, quantity: number) => void;
    setCustomer: (info: Partial<CheckoutState['customer']>) => void;
    setCoupon: (coupon: CouponData | null) => void;
    setOrderBump: (accepted: boolean) => void;
    setActiveBumps: (bumps: any[]) => void;
    setUpsellOffer: (offer: any) => void;
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
            activeBumps: [],
            upsellOffer: null,

            setStep: (step) => set({ step }),
            setCoupon: (coupon) => set({ coupon }),
            setOrderBump: (accepted) => set({ orderBumpAccepted: accepted }),
            setActiveBumps: (bumps) => set({ activeBumps: bumps }),
            setUpsellOffer: (offer) => set({ upsellOffer: offer }),

            addToCart: (item) => set((state) => {
                const existing = state.cart.find(i => i.id === item.id && i.variantId === item.variantId);
                if (existing) {
                    return {
                        cart: state.cart.map(i => i.cartItemId === existing.cartItemId ? { ...i, quantity: i.quantity + 1 } : i)
                    };
                }
                return { cart: [...state.cart, { ...item, quantity: 1, cartItemId: Math.random().toString(36).substr(2, 9) }] };
            }),

            removeFromCart: (cartItemId) => set((state) => ({
                cart: state.cart.filter(i => i.cartItemId !== cartItemId)
            })),

            updateQuantity: (cartItemId, quantity) => set((state) => ({
                cart: state.cart.map(i => i.cartItemId === cartItemId ? { ...i, quantity: Math.max(1, quantity) } : i)
            })),

            setCustomer: (info) => set((state) => ({
                customer: { ...state.customer, ...info }
            })),

            clearCart: () => set({ cart: [], step: 'cart', coupon: null, orderBumpAccepted: false })
        }),
        {
            name: 'creatorly-checkout-storage'
        }
    )
);
