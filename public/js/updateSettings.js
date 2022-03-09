import { showAlert } from './alerts.js';

/// type is either passsword or data
const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? 'http://localhost:3000/api/v1/users/updateMyPassword'
        : 'http://localhost:3000/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url,
      data
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} Updated successfully `);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};

document.querySelector('.form-user-data').addEventListener('submit', e => {
  e.preventDefault();

  const form = new FormData();

  form.append('name', document.querySelector('.form-user-data #name').value);
  form.append('email', document.querySelector('.form-user-data #email').value);
  form.append('photo', document.getElementById('photo').files[0]);
  updateSettings(form, 'data');
});

document
  .querySelector('.form-user-password')
  .addEventListener('submit', async e => {
    e.preventDefault();

    // <div class="spinner-border text-success"></div>
    document.querySelector('.btn--save-password').textContent = 'Updating ....';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('password-confirm').value;
    // awaitng it so that we can wait for it complete , and we then clear off the fields
    await updateSettings(
      { passwordCurrent, password, confirmPassword },
      'password'
    );

    document.getElementById('password-current').value = '';

    document.getElementById('password').value = '';

    document.getElementById('password-confirm').value = '';
    document.querySelector('.btn--save-password').textContent = 'Save Password';
  });
