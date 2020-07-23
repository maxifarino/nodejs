const AWS = require('aws-sdk');
const { cfSign, bucket, apiVersion } = require('../helpers/aws_helper')
const error_helper = require('../helpers/error_helper');
const { asyncForEach } = require('../helpers/utils');
const projectInsuredDocuments = require('../cf_mssql/projectInsuredDocuments');

exports.getProjectInsuredDocuments = async (req, res) => {
	let queryParams = req.query || {};

  await projectInsuredDocuments.getProjectInsuredDocuments(queryParams, async (err, projectInsuredDocuments, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}

		// add S3 url
		await asyncForEach(projectInsuredDocuments, async function(item, idx) {
			const fileName = item.FileName.replace(/\.([a-zA-Z0-9]*)$/, `_${item.DocumentID}.$1`);
			const response = await getS3FileLink(fileName);
			projectInsuredDocuments[idx]['Url'] = response;
		});

		return res.status(200).json({ success: true, projectInsuredDocuments: projectInsuredDocuments, totalCount: totalCount });
	});
};

const getS3FileLink = async (fileName) => (
	new Promise((resolve, reject) => {		
		cfSign(fileName, (err, url) => { err ? reject(err) : resolve(url) });
	})
);

exports.createProjectInsuredDocuments = async (req, res) => {
	let params = req.body;
  let invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if(!params.documentId || (parseInt(params.documentId) <= 0 || isNaN(parseInt(params.documentId)))) invalidData = true;
	if(!params.projectInsuredId || (parseInt(params.projectInsuredId) <= 0 || isNaN(parseInt(params.projectInsuredId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await projectInsuredDocuments.createProjectInsuredDocuments(params, (err, result, projectInsuredDocumentId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, data: { projectInsuredDocumentId: projectInsuredDocumentId } });
	});
};

exports.removeProjectInsuredDocuments = async (req, res) => {
  let params = req.body;
	var invalidData = false;

	if(!params) {
		invalidData = true;
	}

  if(!params.projectInsuredDocumentId) {
		invalidData = true;
	} 
	
	if(params.projectInsuredDocumentId && (parseInt(params.projectInsuredDocumentId) <= 0 || isNaN(parseInt(params.projectInsuredDocumentId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await projectInsuredDocuments.removeProjectInsuredDocuments(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};