const app = require('./app');
const { port } = require('./config/env');

app.listen(port, () => {
  console.log(`SRMM API escuchando en puerto ${port}`);
});
