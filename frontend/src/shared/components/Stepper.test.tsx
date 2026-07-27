import { render, screen } from '@testing-library/react';
import { Stepper } from './Stepper';

describe('Stepper', () => {
  it('renderiza los 4 pasos', () => {
    render(<Stepper current={1} />);
    expect(screen.getByText('Producto')).toBeInTheDocument();
    expect(screen.getByText('Datos')).toBeInTheDocument();
    expect(screen.getByText('Resumen')).toBeInTheDocument();
    expect(screen.getByText('Resultado')).toBeInTheDocument();
  });

  it('marca el paso actual con aria-current', () => {
    render(<Stepper current={2} />);
    const current = screen.getByText('Resumen').closest('li');
    expect(current).toHaveAttribute('aria-current', 'step');
  });

  it('marca los pasos previos como completados (✓)', () => {
    render(<Stepper current={2} />);
    // Pasos 0 y 1 completados muestran ✓
    expect(screen.getAllByText('✓')).toHaveLength(2);
  });
});
