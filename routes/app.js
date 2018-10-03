var express = require('express');
var router = express.Router();
const multer = require('multer');
const cloudStorageHelper = require('../helpers/cloudStorageHelper');

/* GET users listing. */


let fileHandler = multer({
    storage: cloudStorageHelper.multerStorage
});

router.get('/test', function(req, res) {
  res.send('Hurray!');
});

router.post("/file/upload", fileHandler.any(), function(req, res) {
  let filename;
  if (req.files[0].key) {
		filename = cloudStorageHelper.extractFinalKey(req.files[0].key);
	}
	else {
		filename = req.files[0].filename || '';
	}

	console.log("got filename: ", filename);
	res.send("got filename: " + filename);

});


module.exports = router;
