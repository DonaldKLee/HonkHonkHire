const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', async(req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/uploadResume', (req, res) => {
  // const { pdfFile } = req.body.resume;
  const pdfFile = req;
  console.log(pdfFile);
  res.sendFile(path.join(__dirname, 'public', 'interview.html'));
})

app.listen(8080, () => {
    console.log("Server successfully running on port 8080");
  });