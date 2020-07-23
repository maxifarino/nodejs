const AWS = require('aws-sdk');
const { cfSign, bucket, apiVersion } = require('../helpers/aws_helper');
const { cleanUrl, isObjEmpty } = require('../helpers/utils');
const { transferFile } = require('../helpers/sftp_helper');
const error_helper = require('../helpers/error_helper');
const { asyncForEach } = require('../helpers/utils');
const documents = require('../cf_mssql/documents');
const tasks = require('../cf_mssql/tasks');

exports.getDocuments = async (req, res) => {
	let queryParams = req.query || {};
	queryParams.userId = req.currentUser.Id;
	queryParams.userCFRoleId = req.currentUser.CFRole.Id;
	
  await documents.getDocuments(queryParams, async (err, documents, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		// add S3 url
		await asyncForEach(documents, async (item, idx) => {
			const fileName = item.FileName.replace(/\.([a-zA-Z0-9]*)$/, `_${item.DocumentID}.$1`);
			const response = await getS3FileLink(fileName);
			documents[idx]['DocumentUrl'] = response;
		});

		return res.status(200).json({ success: true, documents: documents, totalCount: totalCount });
	});
};

exports.createDocuments = async (req, res) => {		
	let documentFile = (req.files) ? req.files.document : null;
	let params = req.body;
	let invalidData = false;
	console.log('createDocuments: ', documentFile, params);

	if (!documentFile) {
		let error = error_helper.getErrorData (error_helper.CODE_NO_FILE_UPLOADED, error_helper.MSG_NO_FILE_UPLOADED);
		return res.send(error);
	}
	if(!params.name) {
		invalidData = true;
  }
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	params.name = setDocumentFileName(params.name, documentFile.name);
	params.documentTypeId = 0; // hardcoded
	if (req.currentUser) {
		params.userId = req.currentUser.Id;
	}	

  await documents.createDocuments(params, (err, result, documentId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
		}		
				
		// document upload
		const s3 = new AWS.S3({apiVersion: apiVersion, params: {Bucket: bucket}});
		console.log("FileName", params.name);
		
		const key = params.name.replace(/\.([a-zA-Z0-9]*)$/, `_${documentId}.$1`);
  	console.log("Bucket key:" + key);

		const fileParams = {Bucket: bucket, Key: key, Body: documentFile.data, ContentDisposition: 'inline', ContentType: 'application/pdf'};
		//console.log("Bucket params:", JSON.stringify(fileParams));
		s3.upload(fileParams, async (err, data) => {
			if (err) {
				console.log(err)
				return res.status(500).send(err);
			} else {
				console.log("Successfully uploaded data to S3 Bucket");
				const AWSFileLink = await getS3FileLink(key);

				if (params.ftpUpload) {
					console.log("Transfering File...");
					const fileTransfered = await uploadFileToFTPServer(documentFile.data, key);					
					(fileTransfered) 
						? console.log("FTP error")
						: console.log("Successfully transfered");
				}
				return res.status(200).json({ success: true, data: { documentId: documentId, url: AWSFileLink } });
			}
		});	
	});
};

const getS3FileLink = async (fileName) => (
	new Promise((resolve, reject) => {		
		cfSign(fileName, (err, url) => { err ? reject(err) : resolve(url) });
	})
);

const setDocumentFileName = (newFileName, documentFileName) => {	
	const fileExtension = documentFileName.split('.').pop();
	const fileName = newFileName.replace(/ /g, "_");
  return `cf_${fileName}.${fileExtension}`;
};

const uploadFileToFTPServer = async (file, filename) => (
	new Promise((resolve, reject) => {		
		transferFile(file, filename, (err) => { err ? reject(err) : resolve() });
	})
);

exports.removeDocuments = async (req, res) => {
  let params = req.body;
	var invalidData = false;

  if(!params.documentId || (parseInt(params.documentId) <= 0 || isNaN(parseInt(params.documentId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await documents.removeDocuments(params, (err, result, rs) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}

		const s3 = new AWS.S3( { apiVersion: apiVersion, params: {Bucket: bucket } });
		const fileName = rs[0].FileName;
		console.log(fileName);
		const key = fileName.replace(/\.([a-zA-Z0-9]*)$/, `_${params.documentId}.$1`);
		console.log(key);

	  const fileParams = { Bucket: bucket, Key: key };
		s3.deleteObject(fileParams, function(err, data) {
			if (err) {
				console.log(err)
				return res.status(500).send(err);
			} else {
				console.log("Object Successfully deleted from S3 Bucket");
				return res.status(200).json({ success: true });
			}
		});
	});
};

exports.updateDocuments = async (req, res) => {		
	let params = req.body;
	let invalidData = false;
	console.log('updateDocuments: ', params);

	if(!params) {
		invalidData = true;
	}

	if(!params.documentId || !params.hiringClientId || !params.projectId || !params.subcontractorId) {
		invalidData = true;
  }
	if(params.documentId && (parseInt(params.documentId) <= 0 || isNaN(parseInt(params.documentId)))) invalidData = true;
	if(params.hiringClientId && (parseInt(params.hiringClientId) <= 0 || isNaN(parseInt(params.hiringClientId)))) invalidData = true;
	if(params.projectId && (parseInt(params.projectId) <= 0 || isNaN(parseInt(params.projectId)))) invalidData = true;
	if(params.subcontractorId && (parseInt(params.subcontractorId) <= 0 || isNaN(parseInt(params.subcontractorId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	params.userId = req.currentUser.Id;

  await documents.updateDocuments(params, (err) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
		}

		// set queue
		if(params.queueId) {
			documents.setDocumentQueue(params.documentId, params.queueId, (err) => {
				if(err) {
					error = error_helper.getSqlErrorData(err);
  				return res.send(error);
				}
			});
		}

		//FIXME change hardcoded id
		if (params.documentTypeId && params.documentTypeId != 1) {
			if (params.documentStatusId === 14) { // pending review
				tasks.createDocumentTask(params);
			} else {
				tasks.closeTasksByDocument(params);
			}
		}

		return res.status(200).json({ success: true, data: { documentId: params.documentId } });
	});
};

exports.getDocumentStatus = async (req, res) => {
	let queryParams = req.query || {};
  await documents.getDocumentStatus(queryParams, async (err, documentStatus) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, documentStatus });
	});
};

exports.getDocumentTypes = async (req, res) => {
	let queryParams = req.query || {};
  await documents.getDocumentTypes(queryParams, async (err, documentTypes) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, documentTypes });
	});
};
