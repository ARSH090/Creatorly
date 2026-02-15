import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Homepage', () => {
    it('should render hero section', () => {
        render(<Home />);

        // Check for "Creatorly" regardless of level since it might be in an H2 or H1 depending on design
        expect(screen.getByText(/creatorly/i)).toBeInTheDocument();
        expect(screen.getByText(/create your storefront/i)).toBeInTheDocument();
    });

    it('should have Get Started CTA button', () => {
        render(<Home />);

        // Look for button or link with "Get Started" text
        const cta = screen.getByRole('link', { name: /get started/i }) || screen.getByRole('button', { name: /get started/i });
        expect(cta).toBeInTheDocument();
    });

    it('should have navigation links', () => {
        render(<Home />);

        expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
    });
});
