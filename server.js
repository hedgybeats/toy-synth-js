const express = require('express');
const app = express();
const path = require('path');

app.use(express.static(path.resolve(__dirname, 'public')));

app.get('/', function (req, res) {
  res.sendFile(path.resolve(__dirname, 'public/index.html'));
});

const hostname = '127.0.0.1';
const port = 3000;

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
