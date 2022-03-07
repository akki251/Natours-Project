import { showAlert } from './alerts.js';
const updateUserData = async () => {
  const name = document.querySelector('.form-user-data #name').value;
  const email = document.querySelector('.form-user-data #email').value;

  try {
    const res = await axios({
      method: 'PATCH',
      url: 'http://localhost:3000/api/v1/users/updateMe',
      data: {
        name,
        email
      }
    });

    if (res.data.status === 'success') {
      showAlert('success', 'User info updated');
    }
  } catch (error) {
    showAlert('error', 'something went wrong');
  }
};

document.querySelector('.form-user-data').addEventListener('submit', e => {
  e.preventDefault();
  updateUserData();
});
