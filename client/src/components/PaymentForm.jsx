import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';

function InnerPaymentForm({ clientSecret, onSuccess, amountPln }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {},
      redirect: 'if_required'
    });

    setLoading(false);

    if (confirmError) {
      setError(confirmError.message || 'Błąd płatności');
      return;
    }

    // УСПЕХ
    onSuccess?.();
  };

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <h3 style={{ marginBottom: 12 }}>Płatność Stripe</h3>
      <p style={{ opacity: 0.8, marginBottom: 12 }}>
        Do zapłaty: <b>{amountPln.toFixed(2)} zł</b>
      </p>
      <PaymentElement />
      {error && <div className="toast error" style={{ marginTop: 12 }}>{error}</div>}
      <button
        className="btn"
        onClick={handlePay}
        disabled={!stripe || loading}
        style={{ marginTop: 12 }}
      >
        {loading ? 'Przetwarzanie...' : 'Zapłać'}
      </button>
    </div>
  );
}

export default function PaymentForm({ clientSecret, onSuccess, amountPln }) {
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!pk) {
      console.error('Brak VITE_STRIPE_PUBLISHABLE_KEY w env');
      return;
    }
    setStripePromise(loadStripe(pk));
  }, []);

  if (!clientSecret) return null;
  if (!stripePromise) return <div>Ładowanie płatności...</div>;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <InnerPaymentForm clientSecret={clientSecret} onSuccess={onSuccess} amountPln={amountPln} />
    </Elements>
  );
}
