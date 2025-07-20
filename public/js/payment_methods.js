document.addEventListener('DOMContentLoaded', async () => {
  const stripe = Stripe('your-publishable-key'); // Stripe Publishable Key
  const elements = stripe.elements();

  // Payment Request API
  const paymentRequest = stripe.paymentRequest({
    country: 'US',
    currency: 'usd',
    total: {
      label: 'Total',
      amount: 4999, // Ödeme tutarı (sente çevrilmiş)
    },
    requestPayerName: true,
    requestPayerEmail: true,
  });

  const prButton = elements.create('paymentRequestButton', {
    paymentRequest: paymentRequest,
  });

  paymentRequest.canMakePayment().then((result) => {
    if (result) {
      prButton.mount('#google-pay-button');
      prButton.mount('#apple-pay-button');
    } else {
      document.getElementById('google-pay-button').style.display = 'none';
      document.getElementById('apple-pay-button').style.display = 'none';
    }
  });
});
