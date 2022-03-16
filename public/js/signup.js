import { showAlert } from './alerts.js';

const formSignup = document.querySelector('.form--signup');

formSignup?.addEventListener('submit', async e => {
  e.preventDefault();
  const name = formSignup.querySelector('#name').value;
  const email = formSignup.querySelector('#email').value;
  const password = formSignup.querySelector('#password').value;
  const confirmPassword = formSignup.querySelector('#confirmPassword').value;

  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        confirmPassword
      }
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Welcome to Natours !');
      setTimeout(() => {
        location.assign('/');
      }, 2000);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
});
