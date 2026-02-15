import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/(dashboard)/dashboard/page';
import { useAuth } from '@/hooks/useAuth';

jest.mock('@/hooks/useAuth');

describe('Dashboard Page', () => {
    beforeEach(() => {
        (useAuth as jest.Mock).mockReturnValue({
            user: {
                id: '123',
                email: 'creator@example.com',
                displayName: 'Creator',
                role: 'creator',
            },
            loading: false,
        });
    });

    it('should render dashboard with stats', async () => {
        render(<DashboardPage />);

        await waitFor(() => {
            expect(screen.getByText(/total revenue/i)).toBeInTheDocument();
            expect(screen.getByText(/total sales/i)).toBeInTheDocument();
        });
    });

    it('should have navigation to products', () => {
        render(<DashboardPage />);
        expect(screen.getByRole('link', { name: /products/i })).toBeInTheDocument();
    });
});
