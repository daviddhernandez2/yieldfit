import express from 'express';

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.json({
    message: 'Yield Fit API',
    status: 'running',
    version: '1.0.0'
  });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});