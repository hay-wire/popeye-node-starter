var express = require('express');
var router = express.Router();

/* GET users listing. */

router.get('/checkToken', function(req, res) {
  res.send('Hurray!');
});

module.exports = router;
