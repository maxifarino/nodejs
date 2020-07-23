const sql = require('mssql');
const AWS = require('aws-sdk');
const sql_helper = require('../mssql/mssql_helper');
const files_api = require('../api/files');
const _apiVersion = '2006-03-01';
const _sourceBucket = 'prequalusa';
const _destBucket = 'pq7development';
var _allKeys = [];
const _localPath = "/usr/local/my_data/prequalFiles/";

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

_listAllKeys = async function(sourceS3, params) {
  sourceS3.listObjectsV2(params, function (err, data) {
      if (err) {
          console.log(err, err.stack); // an error occurred
      } else {
          let contents = data.Contents;
          contents.forEach(function (content) {
              _allKeys.push(content.Key);
              console.log(content.Key);
          });

          if (data.IsTruncated) {
              params.ContinuationToken = data.NextContinuationToken;
              console.log("get further list...");
              _listAllKeys(sourceS3, params);
          } 

      }
  });
}

_getOriginFileslist = async function() {
	// Get list from view by Sid
	let originFilesList = [];
	await _fetchOriginFileslist(function(originFilesListResult) {
		originFilesList = originFilesListResult;
	});
	return originFilesList;
}

_getFilesinsertQuery = function(fileName, sourceListElement) {
		let subcontractorId = sourceListElement.subcontractorId;
		let hiringClientId = sourceListElement.hiringClientId;
		let fileContentTypeId = sourceListElement.fileContentTypeId;
		let storageLocation = sourceListElement.storageLocation.replaceAll("'", "");;

		let query = ` INSERT INTO Files (Name,SubcontractorId,timestamp,FileTypeId,Description,PayloadId,
									HiringClientId,FileContentTypeId, pq1StorageLocation) VALUES (`;
		query +=  ` '${fileName}',`;
		query +=  ` ${subcontractorId},`;
		query +=  ` getDate(),`;
		query +=  ` 2,`; // Manual file
		query +=  ` '',`;
		query +=  ` ${subcontractorId},`; // For manual files store SC id in payload
		query +=  ` ${hiringClientId},`;
		query +=  ` ${fileContentTypeId},`;		
		query +=  ` '${storageLocation}'`;		
		query +=  ` )`;

		query = sql_helper.getLastIdentityQuery(query,'Files');

		return query;
}

_fetchOriginFileslist = async function(callback) {
	const connection = await sql_helper.getConnection();

	const query =  `SELECT storageLocation, dirtyStorageLocation, hiringClientId, subcontractorId, dateUploaded, fileContentTypeId 
									FROM
									(
									    SELECT REPLACE(storageLocation, '''', '') AS storageLocation, storageLocation AS dirtyStorageLocation, hiringClientId, 
									    			 subcontractorId, dateUploaded, fileContentTypeId 
									    FROM v_int_Manual_Files 
									) T
									WHERE storageLocation NOT IN 
									(SELECT pq1StorageLocation FROM files WHERE NOT pq1StorageLocation IS null)
									ORDER BY DateUploaded ASC; `;

	const result = await connection.request().query(query);
	connection.close();
	callback(result.recordset);
}

_getSourceS3 = async function() {
	AWS.config.credentials  = new AWS.SharedIniFileCredentials({profile: 'origin'});
	return new AWS.S3({apiVersion: _apiVersion, params: {Bucket: _sourceBucket}});
}

_getDestinationS3 = async function() {
	AWS.config.credentials  = new AWS.SharedIniFileCredentials({profile: 'destination'});
	return new AWS.S3({apiVersion: _apiVersion, params: {Bucket: _destBucket}});
}

_downlowdFromSourceS3 = async function(originFilesList, sourceS3) {
	let keyPrefix = "erm/files_public/";
	let fs = require('fs');

	/* // List all keys
  params = {Bucket: _sourceBucket};
	await _listAllKeys(sourceS3, params);
	console.log(_allKeys);
	*/
	
	for(let i = 0; i < originFilesList.length; i++) {
		let fileName = originFilesList[i].storageLocation.split('/').pop();
		let file = fs.createWriteStream(_localPath + fileName);		
		// console.log(_localPath + fileName);

		file = fs.createWriteStream(_localPath + fileName);

		params = {Bucket: _sourceBucket, Key: keyPrefix + fileName};

		await sourceS3.getObject(params, function(err, data) {
		   if (err) {
		       console.log(err)
		   } else {
	       let fileData = data.Body;
	       file.write(fileData);
	       console.log(fileName);
		   }
		});
	}
}

_uploadToDestS3 = async function(originFilesList, destS3) {
	for(let i = 0; i < originFilesList.length; i++) {
		let sourceListElement =  originFilesList[i]
		let dirtyFileName = sourceListElement.dirtyStorageLocation.split('/').pop();
		let fileName = sourceListElement.storageLocation.split('/').pop().replaceAll("'", "");
		console.log(fileName);
		let subcontractorId = sourceListElement.subcontractorId;

		let query = _getFilesinsertQuery(fileName, sourceListElement);
		console.log(query);

		await sql_helper.createTransaction(query, function(err, result, newFileId) {
			if(err) { console.log(err); throw err; } 

			let documentFile = {};
			documentFile.name = fileName;

			let newFileName = files_api.getDocumentFileName(documentFile.name, subcontractorId, newFileId);

			let fs = require('fs');
			fs.readFile(_localPath + dirtyFileName, function (err, data) {
	        if (err){console.log(err); throw err;}
					// console.log(data);
          var params = {
              Key: newFileName,
              Body: data
          };

          destS3.upload(params, function (err, data) {
              if (err) {
                console.log('ERROR MSG: ', err);
              }
              else {
              	console.log('Upload file: ', newFileName);	
              }
          });
	    });		
		});

	}
}

exports.importFiles = async function() {
	console.log("Import files process");

	// Get list of files
	let originFilesList = await _getOriginFileslist();
	// console.log(originFilesList);

	// get source S3 object
	let sourceS3 = await _getSourceS3();
	console.log("Origin bucket object created");

	// get dest S3 object
	let destS3 = await _getDestinationS3();
	console.log("Destination bucket object created");

	// download from source S3
	// await _downlowdFromSourceS3(originFilesList, sourceS3);

	// upload to dest S3
	await _uploadToDestS3(originFilesList, destS3);
}
