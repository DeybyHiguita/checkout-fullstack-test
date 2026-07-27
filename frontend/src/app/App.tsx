import type { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { CardModal } from '../features/checkout/CardModal';
import { SummaryBackdrop } from '../features/checkout/SummaryBackdrop';
import { ProductPage } from '../features/product/ProductPage';
import { ResultPage } from '../features/transaction/ResultPage';
import { useAppSelector } from './hooks';

/** El resumen requiere datos de tarjeta/entrega ya capturados. */
function RequireCardData({ children }: { children: ReactElement }) {
  const ready = useAppSelector((s) => Boolean(s.checkout.cardToken && s.checkout.customer));
  return ready ? children : <Navigate to="/" replace />;
}

/** El resultado requiere una transacción existente. */
function RequireTransaction({ children }: { children: ReactElement }) {
  const ready = useAppSelector((s) => Boolean(s.checkout.transactionId));
  return ready ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ProductPage />} />
      <Route path="/checkout/:productId" element={<CardModal />} />
      <Route
        path="/summary"
        element={
          <RequireCardData>
            <SummaryBackdrop />
          </RequireCardData>
        }
      />
      <Route
        path="/result"
        element={
          <RequireTransaction>
            <ResultPage />
          </RequireTransaction>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
