import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/(auth)/login/page';

// Mock the auth hook or firebase client
jest.mock('@/lib/firebase/client', () => ({
    loginWithEmail: jest.fn().mockResolvedValue({ user: { uid: '123' } })
}));

describe('Login Page', () => {
    it('should render login form', () => {
        render(<LoginPage />);

        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    });

    it('should validate email format', async () => {
        const user = userEvent.setup();
        render(<LoginPage />);

        const emailInput = screen.getByLabelText(/email/i);
        const submitButton = screen.getByRole('button', { name: /log in/i });

        await user.type(emailInput, 'invalid-email');
        await user.click(submitButton);

        await waitFor(() => {
            // Assuming Zod or HTML5 validation shows a message
            expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
        });
    });
});
