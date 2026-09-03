import express from 'express';
const app = express();
app.get('*all', (req, res) => res.send('matched *all'));
app.get('/test', (req, res) => res.send('matched /test'));
const server = app.listen(3002, () => {
  console.log('started');
});
