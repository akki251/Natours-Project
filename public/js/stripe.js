import { showAlert } from './alerts.js';

const stripe = Stripe(
  'pk_test_51KblnYSHXreynmNIkJlF3eNc2NpoIvmDEPF9lb6DMEzADZZekWzbsm8auwWyJG1Mt7fAkOghCyeeeBVTRlREGjKw00HDz3OWDm'
);

const bookBtn = document.getElementById('book-tour');

bookBtn.addEventListener('click', e => {
  // tour-id converts to tourId, js syntax..
  const tourId = e.target.dataset.tourId;
  e.target.textContent = 'Processing';
  bookTour(tourId);
});

const bookTour = async tourId => {
  // 1// get the session
  try {
    const session = await axios(
      `http://localhost:3000/api/v1/bookings/checkoutSession/${tourId}`
    );
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });

    // 2 create the checkout form + charge the credit car
  } catch (err) {
    showAlert('error', err);
    console.log(err);
  }
};
