import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { ProductPage } from '../features/product/ProductPage';

/** Placeholder temporal del checkout (se implementa en el Día 6). */
function CheckoutPlaceholder() {
  const { productId } = useParams();
  return (
    <main className="product-page">
      <h1 className="product-page__title">Checkout</h1>
      <p className="product-page__status">
        Pantalla de pago en construcción para el producto <code>{productId}</code>.
      </p>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ProductPage />} />
      <Route path="/checkout/:productId" element={<CheckoutPlaceholder />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
