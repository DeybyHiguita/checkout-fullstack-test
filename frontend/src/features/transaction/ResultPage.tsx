import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { clearCheckoutState } from '../../app/persistence';
import { Stepper } from '../../shared/components/Stepper';
import { formatCurrency } from '../../shared/format';
import { useDocumentTitle } from '../../shared/useDocumentTitle';
import { resetCheckout, setStep } from '../checkout/checkoutSlice';
import { fetchProducts } from '../product/productSlice';
import { fetchTransaction, resetTransaction } from './transactionSlice';
import './ResultPage.css';

const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 6;

export function ResultPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { transactionId, productId } = useAppSelector((s) => s.checkout);
  const transaction = useAppSelector((s) => s.transaction);

  // Reconciliar tras un refresh: si no hay datos en memoria pero sí id persistido.
  useEffect(() => {
    if (transactionId && transaction.status === 'IDLE') {
      void dispatch(fetchTransaction(transactionId));
    }
  }, [dispatch, transactionId, transaction.status]);

  // Polling corto mientras la transacción siga PENDING.
  useEffect(() => {
    if (!transactionId || transaction.status !== 'PENDING') return;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      void dispatch(fetchTransaction(transactionId));
      if (attempts >= MAX_POLLS) clearInterval(timer);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [dispatch, transactionId, transaction.status]);

  const backToProduct = () => {
    void dispatch(fetchProducts());
    dispatch(resetCheckout());
    dispatch(resetTransaction());
    clearCheckoutState();
    navigate('/');
  };

  const retry = () => {
    dispatch(resetTransaction());
    dispatch(setStep('CARD_DELIVERY'));
    navigate(productId ? `/checkout/${productId}` : '/');
  };

  const view = resolveView(transaction.status, transaction.error);
  useDocumentTitle(view.title);

  return (
    <main className="result">
      <section className={`result__panel result__panel--${view.tone}`}>
        <Stepper current={3} />
        <div className="result__icon" aria-hidden="true">
          {view.icon}
        </div>
        <h1 className="result__title" role={view.tone === 'pending' ? 'status' : 'alert'}>
          {view.title}
        </h1>
        <p className="result__message">{view.message}</p>

        {transaction.transactionNumber && (
          <p className="result__ref">
            Transacción <strong>{transaction.transactionNumber}</strong>
          </p>
        )}
        {transaction.amounts && view.tone === 'success' && (
          <p className="result__amount">
            {formatCurrency(transaction.amounts.totalAmountInCents, transaction.amounts.currency)}
          </p>
        )}

        {view.tone !== 'pending' && (
          <div className="result__actions">
            {(view.tone === 'declined' || view.tone === 'error') && (
              <button className="btn btn--primary" onClick={retry}>
                Volver a intentar
              </button>
            )}
            <button
              className={`btn ${view.tone === 'success' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={backToProduct}
            >
              Volver al producto
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

interface View {
  tone: 'success' | 'declined' | 'error' | 'pending';
  icon: string;
  title: string;
  message: string;
}

function resolveView(status: string, error: string | null): View {
  if (status === 'APPROVED') {
    return {
      tone: 'success',
      icon: '✓',
      title: '¡Pago aprobado!',
      message: 'Tu compra fue confirmada y el producto será asignado para entrega.',
    };
  }
  if (status === 'DECLINED') {
    return {
      tone: 'declined',
      icon: '✕',
      title: 'Pago rechazado',
      message: 'Tu banco rechazó la transacción. Puedes intentar con otra tarjeta.',
    };
  }
  if (status === 'ERROR' || error) {
    return {
      tone: 'error',
      icon: '!',
      title: 'No se pudo procesar',
      message: error ?? 'Ocurrió un problema técnico. Intenta de nuevo en unos minutos.',
    };
  }
  return {
    tone: 'pending',
    icon: '…',
    title: 'Procesando pago…',
    message: 'Estamos confirmando tu transacción con la pasarela.',
  };
}
