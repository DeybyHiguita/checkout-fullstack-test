import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { Stepper } from '../../shared/components/Stepper';
import { formatCurrency } from '../../shared/format';
import { useDocumentTitle } from '../../shared/useDocumentTitle';
import { fetchProducts } from '../product/productSlice';
import { submitCardDelivery } from './checkoutSlice';
import { DemoFillFab, type DemoVariant } from './DemoFillFab';
import { gatewayApi } from './gatewayApi';
import { validateForm, type CheckoutForm, type FormErrors } from './cardFormValidation';
import { detectCardBrand } from './validators/cardBrand';
import { lastFour, maskCardNumber, maskExpiry } from './validators/masks';
import './CardModal.css';

const emptyForm: CheckoutForm = {
  cardNumber: '',
  cardHolder: '',
  expiry: '',
  cvc: '',
  fullName: '',
  email: '',
  documentType: 'CC',
  documentNumber: '',
  phoneNumber: '',
  addressLine: '',
  city: '',
  region: '',
  postalCode: '',
  country: 'CO',
};

/** Máscara/transformación por campo (para inputs numéricos y de tarjeta). */
const applyMask = (name: string, value: string): string => {
  switch (name) {
    case 'cardNumber':
      return maskCardNumber(value);
    case 'expiry':
      return maskExpiry(value);
    case 'cvc':
      return value.replace(/\D/g, '').slice(0, 3);
    case 'documentNumber':
      return value.replace(/\D/g, '');
    default:
      return value;
  }
};

export function CardModal() {
  const { productId } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const products = useAppSelector((s) => s.product.items);
  const product = products.find((p) => p.id === productId);
  const saved = useAppSelector((s) => s.checkout);

  const [form, setForm] = useState<CheckoutForm>(() => ({
    ...emptyForm,
    ...(saved.customer ?? {}),
    ...(saved.delivery ?? {}),
  }));
  const [touched, setTouched] = useState<Partial<Record<keyof CheckoutForm, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  useDocumentTitle('Pago con tarjeta');

  useEffect(() => {
    if (products.length === 0) void dispatch(fetchProducts());
  }, [products.length, dispatch]);

  const errors: FormErrors = useMemo(() => validateForm(form), [form]);
  const brand = detectCardBrand(form.cardNumber);
  const isValid = Object.keys(errors).length === 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: applyMask(name, value) }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const showError = (field: keyof CheckoutForm): string | undefined =>
    touched[field] || submitted ? errors[field] : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    if (!isValid || !productId) return;

    setSubmitting(true);
    try {
      const [expMonth, expYear] = form.expiry.split('/').map((s) => s.trim());
      const acceptanceToken = await gatewayApi.getAcceptanceToken();
      const cardToken = await gatewayApi.tokenizeCard({
        number: form.cardNumber,
        cvc: form.cvc,
        expMonth,
        expYear,
        holder: form.cardHolder,
      });

      dispatch(
        submitCardDelivery({
          productId,
          customer: {
            fullName: form.fullName,
            email: form.email,
            documentType: form.documentType,
            documentNumber: form.documentNumber,
            phoneNumber: form.phoneNumber,
          },
          delivery: {
            addressLine: form.addressLine,
            city: form.city,
            region: form.region,
            postalCode: form.postalCode,
            country: form.country,
          },
          cardBrand: brand === 'UNKNOWN' ? 'VISA' : brand,
          cardLastFour: lastFour(form.cardNumber),
          cardToken,
          acceptanceToken,
        }),
      );
      navigate('/summary');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'No se pudo procesar la tarjeta');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldProps = (name: keyof CheckoutForm) => ({
    name,
    value: form[name],
    onChange: handleChange,
    onBlur: handleBlur,
  });

  // Autollenado de prueba (solo modo demo). El número de tarjeta define el resultado.
  const fillDemo = (variant: DemoVariant) => {
    const cardByVariant: Record<DemoVariant, string> = {
      approved: '4242 4242 4242 4242',
      declined: '4000 0000 0000 0002',
      error: '4000 0000 0000 0119',
    };
    setForm({
      cardNumber: cardByVariant[variant],
      cardHolder: 'Jane Doe',
      expiry: '12/29',
      cvc: '123',
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      documentType: 'CC',
      documentNumber: '1234567890',
      phoneNumber: '3001234567',
      addressLine: 'Cra 1 # 2-3',
      city: 'Bogotá',
      region: 'Cundinamarca',
      postalCode: '110111',
      country: 'CO',
    });
  };

  return (
    <main className="checkout">
      <div className="checkout__sheet">
        <header className="checkout__header">
          <button className="checkout__back" onClick={() => navigate('/')} aria-label="Volver">
            ←
          </button>
          <h1 className="checkout__title">Pago con tarjeta</h1>
        </header>

        <Stepper current={1} />

        {product && (
          <p className="checkout__product">
            {product.name} ·{' '}
            <strong>{formatCurrency(product.priceInCents, product.currency)}</strong>
          </p>
        )}

        <form className="checkout__form" onSubmit={(e) => void handleSubmit(e)} noValidate>
          <fieldset className="checkout__group">
            <legend>Tarjeta</legend>

            <Field label="Número de tarjeta" error={showError('cardNumber')}>
              <div className="checkout__card-input">
                <input
                  autoFocus
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="4242 4242 4242 4242"
                  {...fieldProps('cardNumber')}
                />
                {brand !== 'UNKNOWN' && (
                  <span
                    className={`brand brand--${brand.toLowerCase()}`}
                    data-testid="card-brand"
                    aria-hidden="true"
                  >
                    {brand}
                  </span>
                )}
              </div>
            </Field>

            <Field label="Titular" error={showError('cardHolder')}>
              <input
                autoComplete="cc-name"
                placeholder="Como aparece en la tarjeta"
                {...fieldProps('cardHolder')}
              />
            </Field>

            <div className="checkout__row">
              <Field label="Expiración" error={showError('expiry')}>
                <input
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="MM/YY"
                  {...fieldProps('expiry')}
                />
              </Field>
              <Field label="CVC" error={showError('cvc')}>
                <input
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="123"
                  maxLength={3}
                  {...fieldProps('cvc')}
                />
              </Field>
            </div>
          </fieldset>

          <fieldset className="checkout__group">
            <legend>Datos del comprador</legend>
            <Field label="Nombre completo" error={showError('fullName')}>
              <input {...fieldProps('fullName')} />
            </Field>
            <Field label="Correo electrónico" error={showError('email')}>
              <input type="email" {...fieldProps('email')} />
            </Field>
            <div className="checkout__row">
              <Field label="Tipo doc.">
                <select {...fieldProps('documentType')}>
                  <option value="CC">CC</option>
                  <option value="CE">CE</option>
                  <option value="PASSPORT">Pasaporte</option>
                </select>
              </Field>
              <Field label="Número doc." error={showError('documentNumber')}>
                <input inputMode="numeric" {...fieldProps('documentNumber')} />
              </Field>
            </div>
            <Field label="Teléfono" error={showError('phoneNumber')}>
              <input inputMode="tel" {...fieldProps('phoneNumber')} />
            </Field>
          </fieldset>

          <fieldset className="checkout__group">
            <legend>Entrega</legend>
            <Field label="Dirección" error={showError('addressLine')}>
              <input {...fieldProps('addressLine')} />
            </Field>
            <div className="checkout__row">
              <Field label="Ciudad" error={showError('city')}>
                <input {...fieldProps('city')} />
              </Field>
              <Field label="Departamento" error={showError('region')}>
                <input {...fieldProps('region')} />
              </Field>
            </div>
            <Field label="Código postal (opcional)">
              <input {...fieldProps('postalCode')} />
            </Field>
          </fieldset>

          {serverError && (
            <p className="checkout__server-error" role="alert">
              {serverError}
            </p>
          )}

          <button className="btn btn--primary checkout__submit" type="submit" disabled={submitting}>
            {submitting ? 'Procesando…' : 'Continuar al resumen'}
          </button>
        </form>
      </div>
      <DemoFillFab onFill={fillDemo} />
    </main>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`field${error ? ' field--error' : ''}`}>
      <span className="field__label">{label}</span>
      {children}
      {error && <span className="field__error">{error}</span>}
    </label>
  );
}
