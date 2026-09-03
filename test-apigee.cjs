const axios = require('axios');
axios.get('https://apigee.googleapis.com/v1/organizations/fake-org-1234/apis', {
  headers: { Authorization: 'Bearer FAKE' }
}).catch(err => {
  console.log(err.message);
  console.log(err.response?.data);
});
