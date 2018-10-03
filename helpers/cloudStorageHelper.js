
const AWS = require('aws-sdk');
const debug = require('debug')('popeye:helpers:cloudStorageHelper');
const fs = require('fs');
const configConsts = require('../config/constants');
let multerS3 = require('multer-s3');

const myBucket = process.env.AWS_S3_BUCKET_NAME;
const myS3SourcePath = process.env.AWS_S3_ROOT_PATH || '';

const signedUrlExpiryTime = configConsts.CLOUD_STORAGE_SIGNED_URL_EXPIRY * 60;

const s3 = new AWS.S3({
	signatureVersion: 'v4',
	region: process.env.AWS_S3_BUCKET_REGION,
	params: {
		Bucket: myBucket
	}
});
s3.createBucket();

exports.s3 = s3;


exports.multerStorage = multerS3({
	s3: s3,
	bucket: process.env.AWS_S3_BUCKET_NAME,
	metadata: function (req, file, cb) {
		cb(null, {fieldName: file.fieldname});
	},
	key: function (req, file, cb) {
		cb(null, process.env.AWS_S3_ROOT_PATH + file.originalname.toLowerCase().replace(/[^a-zA-Z0-9\s\.\-\_]+/g, '' ))
	}
});

// https://aws.amazon.com/blogs/developer/announcing-the-amazon-s3-managed-uploader-in-the-aws-sdk-for-javascript/
exports.upload = (fileObj) => {
	debug("uploading: ", fileObj.path, fileObj.filename, fileObj.mimetype);

	return new Promise((resolve, reject) => {
		let bodyStream = fs.createReadStream(fileObj.path);	//	.pipe(zlib.createGzip()); (gzipping corrupts the file)
		return s3.upload({
				Key: myS3SourcePath + fileObj.filename,
				Body: bodyStream,
				Bucket: myBucket,
				ContentType: fileObj.mimetype
			})
			.on('httpUploadProgress', function(evt) {
				debug('Upload Progress:', evt.loaded, '/', evt.total);
			})
			.send((err, data) => {
				bodyStream.close();
				debug("Upload complete: ", err, data);
				if(err){
					return reject(err);
				}

				resolve({...data, destKey: extractFinalKey(data.Key)});
			});

	})
};


exports.generateSignedUrl = (key) => {
	// https://xxxxx.s3.ap-south-1.amazonaws.com/files/yyyyy.jpg
	// after splitting:
	// [	"https://xxxxx.s3.ap-south-1.amazonaws.com/files/yyyyy.jpg",
	// 		"xxxxx..s3.ap-south-1.amazonaws.com",		# host
	// 		"files/yyyyy.jpg"							# key (file path)
	// ]

	//const urlParts = locationUrl.match(/https\:\/\/([^\/]+)\/([^\/]+)\/(.+)/);
	// const urlParts = locationUrl.match(/https\:\/\/([^\/]+)\/(.+)/);
	//
	// debug("Parsed URL parts: ", urlParts);
	//
	// if(!urlParts || urlParts.length < 3){
	// 	return false;
	// }

	const signedUrl = s3.getSignedUrl('getObject', {
		Bucket: myBucket,
		Key: myS3SourcePath + key,
		Expires: signedUrlExpiryTime // in seconds
	});

	debug("Generated signed url: ", signedUrl);
	return signedUrl;
};

exports.ls = (bucketName) => {
	debug("bucketName: ", bucketName);
	return new Promise((resolve, reject) => {
		s3.listObjectsV2({ Bucket: bucketName }, function(err, data) {
			if(err){
				debug("list objects error: ", err);
				return reject(err)
			}
			debug("list objects result: ", data);
			resolve(data.Contents);
		})
	})
};

exports.cat = (bucketName, key) => {
	debug(`catting ${bucketName}/${key}`);

	let stream = s3
		.getObject({Bucket: bucketName, Key: key})
		.createReadStream();

	return Promise.resolve(stream);
};


exports.cp = (srcBucketName, srcKey) => {

	return new Promise((resolve, reject) => {
		const destKey = extractFinalKey(srcKey);
		const params = {
			CopySource: srcBucketName + '/' + srcKey,
			Bucket: myBucket,
			Key: myS3SourcePath + destKey	// last part is the filename
		};

		s3.copyObject(params, function(err, data) {
			if(err){
				debug("Error copying from source to destination bucket: ", err);
				return reject(err);
			}
			debug("S3 copy result: ", data);
			resolve({...data, destKey});
		});
	})
};

let extractFinalKey = exports.extractFinalKey = (key) => {
	return key.split('/').pop()
};
