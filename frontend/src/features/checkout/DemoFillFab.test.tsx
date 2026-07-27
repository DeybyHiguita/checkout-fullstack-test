import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DemoFillFab } from './DemoFillFab';

// En tests, gatewayEnv está mapeado a simulado (IS_SIMULATED_GATEWAY = true).
describe('DemoFillFab', () => {
  it('muestra el botón flotante en modo simulado y despliega opciones', async () => {
    const onFill = jest.fn();
    render(<DemoFillFab onFill={onFill} />);

    const toggle = screen.getByRole('button', { name: /autollenar datos de prueba/i });
    expect(toggle).toBeInTheDocument();

    await userEvent.click(toggle);
    expect(screen.getByRole('menuitem', { name: /aprobada/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /declinada/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /error/i })).toBeInTheDocument();
  });

  it('invoca onFill con la variante elegida y cierra el menú', async () => {
    const onFill = jest.fn();
    render(<DemoFillFab onFill={onFill} />);

    await userEvent.click(screen.getByRole('button', { name: /autollenar datos de prueba/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /declinada/i }));

    expect(onFill).toHaveBeenCalledWith('declined');
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });
});
