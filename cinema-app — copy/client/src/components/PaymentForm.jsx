import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { api } from '../services/api.js';
import { useToast } from '../App.jsx';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#e6e8ef',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#9ca3af'
      }
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444'
    }
  },
  hidePostalCode: true
};

export default function PaymentForm({ ticketId, amount, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Dane rozliczeniowe
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '00-001',
      country: 'PL'
    }
  });

  const handleBillingChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setBillingDetails(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setBillingDetails(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    // Walidacja wymaganych pól
    if (!billingDetails.name.trim()) {
      setError('Imię i nazwisko jest wymagane');
      return;
    }
    if (!billingDetails.email.trim()) {
      setError('Email jest wymagany');
      return;
    }
    if (!billingDetails.address.line1.trim()) {
      setError('Adres jest wymagany');
      return;
    }
    if (!billingDetails.address.city.trim()) {
      setError('Miasto jest wymagane');
      return;
    }

    if (!stripe || !elements) {
      setError('Stripe nie jest załadowany');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Błąd formularza karty');
      return;
    }

    setLoading(true);
    showToast('info', 'Przetwarzanie płatności...');

    try {
      // Utwórz payment intent
      const response = await api.post('/tickets/create-payment-intent', {
        ticket_id: ticketId,
        amount: amount
      });

      const { clientSecret } = response.data;

      // Potwierdź płatność
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: billingDetails.name,
            email: billingDetails.email,
            phone: billingDetails.phone || undefined,
            address: {
              line1: billingDetails.address.line1,
              line2: billingDetails.address.line2 || undefined,
              city: billingDetails.address.city,
              postal_code: billingDetails.address.postal_code,
              country: billingDetails.address.country
            }
          }
        }
      });

      if (result.error) {
        setError(result.error.message);
        showToast('error', result.error.message);
      } else if (result.paymentIntent.status === 'succeeded') {
        showToast('success', '✅ Płatność zakończona sukcesem!');
        setTimeout(() => onSuccess(), 1500);
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error.response?.data?.message || 'Błąd płatności';
      setError(errorMessage);
      showToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.02)',
    color: '#e6e8ef',
    fontSize: '16px',
    marginBottom: '15px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#e6e8ef'
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <form onSubmit={handleSubmit}>
        {/* Dane osobowe */}
        <div style={{ marginBottom: '25px' }}>
          <h4 style={{ color: '#e6e8ef', marginBottom: '15px' }}>👤 Dane osobowe</h4>
          
          <label style={labelStyle}>Imię i nazwisko *</label>
          <input
            type="text"
            value={billingDetails.name}
            onChange={(e) => handleBillingChange('name', e.target.value)}
            placeholder="Jan Kowalski"
            required
            style={inputStyle}
          />

          <label style={labelStyle}>Email *</label>
          <input
            type="email"
            value={billingDetails.email}
            onChange={(e) => handleBillingChange('email', e.target.value)}
            placeholder="jan@example.com"
            required
            style={inputStyle}
          />

          <label style={labelStyle}>Telefon</label>
          <input
            type="tel"
            value={billingDetails.phone}
            onChange={(e) => handleBillingChange('phone', e.target.value)}
            placeholder="+48 123 456 789"
            style={inputStyle}
          />
        </div>

        {/* Adres rozliczeniowy */}
        <div style={{ marginBottom: '25px' }}>
          <h4 style={{ color: '#e6e8ef', marginBottom: '15px' }}>📍 Adres rozliczeniowy</h4>
          
          <label style={labelStyle}>Ulica i numer *</label>
          <input
            type="text"
            value={billingDetails.address.line1}
            onChange={(e) => handleBillingChange('address.line1', e.target.value)}
            placeholder="ul. Przykładowa 123"
            required
            style={inputStyle}
          />

          <label style={labelStyle}>Adres cd. (opcjonalne)</label>
          <input
            type="text"
            value={billingDetails.address.line2}
            onChange={(e) => handleBillingChange('address.line2', e.target.value)}
            placeholder="m. 45"
            style={inputStyle}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={labelStyle}>Miasto *</label>
              <input
                type="text"
                value={billingDetails.address.city}
                onChange={(e) => handleBillingChange('address.city', e.target.value)}
                placeholder="Warszawa"
                required
                style={{...inputStyle, marginBottom: '0'}}
              />
            </div>
            <div>
              <label style={labelStyle}>Kod pocztowy *</label>
              <input
                type="text"
                value={billingDetails.address.postal_code}
                onChange={(e) => handleBillingChange('address.postal_code', e.target.value)}
                placeholder="00-001"
                required
                style={{...inputStyle, marginBottom: '0'}}
              />
            </div>
          </div>
        </div>

        {/* Dane karty */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ ...labelStyle, marginBottom: '12px' }}>💳 Dane karty</label>
          <div style={{ 
            padding: '12px', 
            border: '1px solid rgba(255,255,255,0.15)', 
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.02)'
          }}>
            <CardElement 
              options={CARD_ELEMENT_OPTIONS}
              onChange={(event) => {
                if (event.error) {
                  setError(event.error.message);
                } else {
                  setError(null);
                }
              }}
            />
          </div>
        </div>
        
        {error && (
          <div style={{ 
            color: '#ef4444', 
            fontSize: '14px', 
            marginBottom: '15px',
            padding: '10px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            ⚠️ {error}
          </div>
        )}
        
        <button 
          type="submit" 
          className="btn" 
          disabled={!stripe || loading}
          style={{ 
            width: '100%', 
            padding: '15px', 
            fontSize: '16px',
            opacity: (!stripe || loading) ? 0.6 : 1,
            marginTop: '10px'
          }}
        >
          {loading ? '🔄 Przetwarzanie płatności...' : `💰 Zapłać ${amount} zł`}
        </button>
        
        {!stripe && (
          <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: '10px', fontSize: '14px' }}>
            Ładowanie Stripe...
          </p>
        )}
      </form>
    </div>
  );
}
