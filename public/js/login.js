import { showAlert } from './alerts.js';

const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password
      }
    });

    if (res.data.status === 'success') {
      showAlert('success', 'you are logged in');
      setTimeout(() => {
        location.assign('/');
      }, 1500);
    }

    // console.log(res);
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};

document.querySelector('.form--login')?.addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  login(email, password);
});

// LOG 
export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout'
    });

    if (res.data.status === 'success') {
      // /NOTE force reload from server not from browser cache
      location.reload(true);
    }
  } catch (err) {
    // console.log(err);
    showAlert('error', 'Error Logging out ! Try again');
  }
};

const logoutBtn = document.querySelector('.nav__el--logout');
if (logoutBtn) {
  // console.log(logoutBtn);
  logoutBtn.addEventListener('click', logout);
}
