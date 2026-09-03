const axios = require('axios');
(async () => {
  const axiosInstance = axios.create({ baseURL: 'http://localhost:3000', withCredentials: true });
  try {
    const res = await axiosInstance.post('/api/session/connect', {
      organization: 'test',
      accessToken: 'test'
    });
    console.log('Connect:', res.status);
    const cookie = res.headers['set-cookie'][0].split(';')[0];
    
    const res2 = await axiosInstance.get('/api/proxies', {
      headers: { Cookie: cookie }
    });
    console.log('Proxies:', res2.status);
  } catch (err) {
    console.log('Error:', err.response?.status, err.response?.data);
  }
})();
