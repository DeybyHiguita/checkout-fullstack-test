import { render, screen } from '@testing-library/react';
import App from './App';

describe('App (smoke)', () => {
  it('renderiza el contenido inicial', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /get started/i })).toBeInTheDocument();
  });
});
