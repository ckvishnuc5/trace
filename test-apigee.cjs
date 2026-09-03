const axios = require('axios');
axios.get('https://apigee.googleapis.com/v1/organizations/fake-org-1234/apis', {
  headers: { Authorization: 'Bearer invalid' }
}).catch(err => {
  console.log('STATUS:', err.response?.status);
  console.log('DATA:', JSON.stringify(err.response?.data));
});
