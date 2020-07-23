const AWS = require('aws-sdk');
const { cfSign, bucket, apiVersion } = require('../helpers/aws_helper')
const error_helper = require('../helpers/error_helper');
const { asyncForEach } = require('../helpers/utils');
const requirementSetsDocuments = require('../cf_mssql/requirementSetsDocuments');

exports.getRequirementSetsDocuments = async (req, res) => {
	let queryParams = req.query || {};

  await requirementSetsDocuments.getRequirementSetsDocuments(queryParams, async (err, requirementSetsDocuments, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}

		// add S3 url
		await asyncForEach(requirementSetsDocuments, async function(item, idx) {
			if (item.FileName !== 'undefined') {
				const fileName = item.FileName.replace(/\.([a-zA-Z0-9]*)$/, `_${item.DocumentID}.$1`);
				let AWSFileLink = '';
				try {
					AWSFileLink = await getS3FileLink(fileName);
				} catch (err) {
					console.error('So this happened:', err);
				}
				requirementSetsDocuments[idx]['Url'] = AWSFileLink;
			}
		});
		
		return res.status(200).json({ success: true, requirementSetsDocuments: requirementSetsDocuments, totalCount: totalCount });
	});
};

const getS3FileLink = async (fileName) => (
	new Promise((resolve, reject) => {		
		cfSign(fileName, (err, url) => { err ? reject(err) : resolve(url) });
	})
);

exports.createRequirementSetsDocuments = async (req, res) => {
	let params = req.body;
  let invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if(!params.documentId || !params.requirementSetId) {
		invalidData = true;
  }

	if(params.documentId && (parseInt(params.documentId) <= 0 || isNaN(parseInt(params.documentId)))) invalidData = true;
	if(params.requirementSetId && (parseInt(params.requirementSetId) <= 0 || isNaN(parseInt(params.requirementSetId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await requirementSetsDocuments.createRequirementSetsDocuments(params, (err, result, requirementSetsDocumentId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, data: { requirementSetsDocumentId: requirementSetsDocumentId } });
	});
};

exports.removeRequirementSetsDocuments = async (req, res) => {
  let params = req.body;
	var invalidData = false;

	if(!params) {
		invalidData = true;
	}

  if(!params.requirementSetsDocumentId) {
		invalidData = true;
	} 
	
	if(params.requirementSetsDocumentId && (parseInt(params.requirementSetsDocumentId) <= 0 || isNaN(parseInt(params.requirementSetsDocumentId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await requirementSetsDocuments.removeRequirementSetsDocuments(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};