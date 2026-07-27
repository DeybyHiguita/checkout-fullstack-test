import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { formatCurrency } from '../../shared/format';
import type { Product } from '../../shared/types';
import { fetchProducts } from './productSlice';
import './ProductPage.css';

export function ProductPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, loading, error } = useAppSelector((state) => state.product);

  useEffect(() => {
    void dispatch(fetchProducts());
  }, [dispatch]);

  if (loading) {
    return (
      <main className="product-page" aria-busy="true">
        <p className="product-page__status" role="status">
          Cargando productos…
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="product-page">
        <p className="product-page__status product-page__status--error" role="alert">
          {error}
        </p>
        <button className="btn btn--secondary" onClick={() => void dispatch(fetchProducts())}>
          Reintentar
        </button>
      </main>
    );
  }

  return (
    <main className="product-page">
      <h1 className="product-page__title">Productos</h1>
      <ul className="product-list">
        {items.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onBuy={() => navigate(`/checkout/${product.id}`)}
          />
        ))}
      </ul>
    </main>
  );
}

function ProductCard({ product, onBuy }: { product: Product; onBuy: () => void }) {
  const soldOut = product.availableQuantity <= 0;
  return (
    <li className="product-card">
      <img
        className="product-card__image"
        src={product.imageUrl}
        alt={product.name}
        loading="lazy"
        width={600}
        height={600}
      />
      <div className="product-card__body">
        <h2 className="product-card__name">{product.name}</h2>
        <p className="product-card__description">{product.description}</p>
        <div className="product-card__meta">
          <span className="product-card__price">
            {formatCurrency(product.priceInCents, product.currency)}
          </span>
          <span className={`product-card__stock${soldOut ? ' product-card__stock--out' : ''}`}>
            {soldOut ? 'Agotado' : `${product.availableQuantity} disponibles`}
          </span>
        </div>
        <button className="btn btn--primary" onClick={onBuy} disabled={soldOut}>
          Pagar con tarjeta de crédito
        </button>
      </div>
    </li>
  );
}
