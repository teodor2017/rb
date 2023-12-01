const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Finally it works!!!!');
});

app.listen(port, () => {
  console.log(`See is running at http://localhost:${port}`);
});
