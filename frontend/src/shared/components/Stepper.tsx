import './Stepper.css';

const STEPS = ['Producto', 'Datos', 'Resumen', 'Resultado'];

/** Indicador de progreso del checkout (paso actual 0-3). */
export function Stepper({ current }: { current: number }) {
  return (
    <nav className="stepper" aria-label="Progreso del checkout">
      <ol className="stepper__list">
        {STEPS.map((label, index) => {
          const state = index < current ? 'done' : index === current ? 'current' : 'upcoming';
          return (
            <li
              key={label}
              className={`stepper__step stepper__step--${state}`}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              <span className="stepper__dot">{index < current ? '✓' : index + 1}</span>
              <span className="stepper__label">{label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
