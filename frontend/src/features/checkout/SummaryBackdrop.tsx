import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { formatCurrency } from '../../shared/format';
import {
  createTransaction,
  fetchTransaction,
  payTransaction,
} from '../transaction/transactionSlice';
import { setPendingTransaction, setStep } from './checkoutSlice';
import './SummaryBackdrop.css';

export function SummaryBackdrop() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const checkout = useAppSelector((s) => s.checkout);
  const products = useAppSelector((s) => s.product.items);
  const transaction = useAppSelector((s) => s.transaction);
  const started = useRef(false);

  const product = products.find((p) => p.id === checkout.productId);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // Al refrescar ya existe una transacción: se reconcilia en vez de crear otra.
    if (checkout.transactionId) {
      void dispatch(fetchTransaction(checkout.transactionId));
      return;
    }
    if (checkout.productId && checkout.customer && checkout.delivery) {
      void dispatch(
        createTransaction({
          productId: checkout.productId,
          customer: checkout.customer,
          delivery: checkout.delivery,
        }),
      ).then((res) => {
        if (createTransaction.fulfilled.match(res)) {
          dispatch(
            setPendingTransaction({
              id: res.payload.transactionId,
              number: res.payload.transactionNumber,
            }),
          );
        }
      });
    }
  }, [dispatch, checkout.transactionId, checkout.productId, checkout.customer, checkout.delivery]);

  const handlePay = async () => {
    if (!transaction.transactionId || !checkout.cardToken || !checkout.acceptanceToken) return;
    const res = await dispatch(
      payTransaction({
        id: transaction.transactionId,
        body: {
          cardToken: checkout.cardToken,
          acceptanceToken: checkout.acceptanceToken,
          installments: 1,
        },
      }),
    );
    if (payTransaction.fulfilled.match(res)) {
      dispatch(setStep('RESULT'));
      navigate('/result');
    }
    // Si falla (pasarela caída), el error se muestra abajo y se permite reintentar.
  };

  const amounts = transaction.amounts;

  return (
    <main className="summary">
      <div className="summary__backdrop" aria-hidden="true" />
      <section className="summary__panel" role="dialog" aria-label="Resumen de pago">
        <h1 className="summary__title">Resumen de pago</h1>

        {product && <p className="summary__product">{product.name}</p>}

        {transaction.loading && !amounts && (
          <p className="summary__status" role="status">
            Calculando totales…
          </p>
        )}

        {transaction.error && !amounts && (
          <p className="summary__status summary__status--error" role="alert">
            {transaction.error}
          </p>
        )}

        {amounts && (
          <>
            <dl className="summary__lines">
              <Line
                label="Producto"
                value={amounts.productAmountInCents}
                currency={amounts.currency}
              />
              <Line
                label="Tarifa base"
                value={amounts.baseFeeInCents}
                currency={amounts.currency}
              />
              <Line label="Envío" value={amounts.deliveryFeeInCents} currency={amounts.currency} />
              <Line
                label="Total"
                value={amounts.totalAmountInCents}
                currency={amounts.currency}
                total
              />
            </dl>

            {checkout.cardLastFour && (
              <p className="summary__card">
                {checkout.cardBrand} •••• {checkout.cardLastFour}
              </p>
            )}

            {transaction.error && (
              <p className="summary__status summary__status--error" role="alert">
                {transaction.error}
              </p>
            )}

            <button
              className="btn btn--primary summary__pay"
              onClick={() => void handlePay()}
              disabled={transaction.loading}
            >
              {transaction.loading
                ? 'Procesando…'
                : `Pagar ${formatCurrency(amounts.totalAmountInCents, amounts.currency)}`}
            </button>
            <button className="btn btn--secondary" onClick={() => navigate('/')}>
              Cancelar
            </button>
          </>
        )}
      </section>
    </main>
  );
}

function Line({
  label,
  value,
  currency,
  total = false,
}: {
  label: string;
  value: number;
  currency: string;
  total?: boolean;
}) {
  return (
    <div className={`summary__line${total ? ' summary__line--total' : ''}`}>
      <dt>{label}</dt>
      <dd>{formatCurrency(value, currency)}</dd>
    </div>
  );
}
