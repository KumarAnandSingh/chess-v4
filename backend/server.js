const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => res.send('OK'));

if (require.main === module) {
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}

module.exports = app;