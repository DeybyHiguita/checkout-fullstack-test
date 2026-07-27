import { Navigate, Route, Routes } from 'react-router-dom';
import { CardModal } from '../features/checkout/CardModal';
import { ProductPage } from '../features/product/ProductPage';

/** Placeholder temporal del resumen (se implementa en el Día 7). */
function SummaryPlaceholder() {
  return (
    <main className="product-page">
      <h1 className="product-page__title">Resumen</h1>
      <p className="product-page__status">Resumen de pago en construcción (Día 7).</p>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ProductPage />} />
      <Route path="/checkout/:productId" element={<CardModal />} />
      <Route path="/summary" element={<SummaryPlaceholder />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
