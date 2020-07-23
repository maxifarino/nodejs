const AWS = require('aws-sdk');
const { cfSign, bucket, apiVersion } = require('../helpers/aws_helper')
const error_helper = require('../helpers/error_helper');
const { asyncForEach } = require('../helpers/utils');
const coverageDocuments = require('../cf_mssql/coverageDocuments');

exports.getCoverageDocuments = async (req, res) => {
	let queryParams = req.query || {};

  await coverageDocuments.getCoverageDocuments(queryParams, async (err, coverageDocuments, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}

		// add S3 url
		await asyncForEach(coverageDocuments, async function(item, idx) {
			const fileName = item.FileName.replace(/\.([a-zA-Z0-9]*)$/, `_${item.DocumentID}.$1`);
			const response = await getS3FileLink(fileName);
			//console.log(response)
			coverageDocuments[idx]['Url'] = response;
		});
		
		return res.status(200).json({ success: true, coverageDocuments: coverageDocuments, totalCount: totalCount });
	});
};

const getS3FileLink = async (fileName) => (
	new Promise((resolve, reject) => {		
		cfSign(fileName, (err, url) => { err ? reject(err) : resolve(url) });
	})
)

exports.createCoverageDocuments = async (req, res) => {
	let params = req.body;
  let invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if(!params.documentId || !params.coverageId) {
		invalidData = true;
  }

	if(params.documentId && (parseInt(params.documentId) <= 0 || isNaN(parseInt(params.documentId)))) invalidData = true;
	if(params.coverageId && (parseInt(params.coverageId) <= 0 || isNaN(parseInt(params.coverageId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await coverageDocuments.createCoverageDocuments(params, (err, result, coverageDocumentId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, data: { coverageDocumentId: coverageDocumentId } });
	});
};

exports.removeCoverageDocuments = async (req, res) => {
  let params = req.body;
	var invalidData = false;

	if(!params) {
		invalidData = true;
	}

  if(!params.coverageDocumentId) {
		invalidData = true;
	} 
	
	if(params.coverageDocumentId && (parseInt(params.coverageDocumentId) <= 0 || isNaN(parseInt(params.coverageDocumentId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await coverageDocuments.removeCoverageDocuments(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};