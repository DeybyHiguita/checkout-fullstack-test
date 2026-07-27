import { useState } from 'react';
import { IS_SIMULATED_GATEWAY } from './gatewayEnv';
import './DemoFillFab.css';

export type DemoVariant = 'approved' | 'declined' | 'error';

const OPTIONS: { variant: DemoVariant; label: string; icon: string }[] = [
  { variant: 'approved', label: 'Aprobada', icon: '✅' },
  { variant: 'declined', label: 'Declinada', icon: '❌' },
  { variant: 'error', label: 'Error', icon: '⚠️' },
];

/**
 * Botón flotante SOLO visible en modo simulado (sin llaves reales). Autollena el
 * formulario con datos de prueba válidos para probar el flujo rápidamente.
 */
export function DemoFillFab({ onFill }: { onFill: (variant: DemoVariant) => void }) {
  const [open, setOpen] = useState(false);

  if (!IS_SIMULATED_GATEWAY) return null;

  return (
    <div className="demo-fab">
      {open && (
        <div className="demo-fab__menu" role="menu" aria-label="Autollenar formulario de prueba">
          {OPTIONS.map((opt) => (
            <button
              key={opt.variant}
              type="button"
              className="demo-fab__option"
              role="menuitem"
              onClick={() => {
                onFill(opt.variant);
                setOpen(false);
              }}
            >
              <span aria-hidden="true">{opt.icon}</span> {opt.label}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className="demo-fab__toggle"
        aria-expanded={open}
        aria-label="Autollenar datos de prueba (modo demo)"
        onClick={() => setOpen((v) => !v)}
      >
        ⚡
      </button>
    </div>
  );
}
