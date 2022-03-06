const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) {
    el.parentElement.removeChild(el);
  }
};

const showAlert = (type, message) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${message}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, 5000);
};

const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/users/login',
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

    console.log(res);
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};

document.querySelector('.form').addEventListener('submit', e => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  login(email, password);
});
