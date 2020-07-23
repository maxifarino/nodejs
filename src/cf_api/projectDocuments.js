const AWS = require('aws-sdk');
const { cfSign, bucket, apiVersion } = require('../helpers/aws_helper')
const error_helper = require('../helpers/error_helper');
const { asyncForEach } = require('../helpers/utils');
const projectDocuments = require('../cf_mssql/projectDocuments');

exports.getProjectDocuments = async (req, res) => {
	let queryParams = req.query || {};

  await projectDocuments.getProjectDocuments(queryParams, async (err, projectDocuments, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}

		// add S3 url
		await asyncForEach(projectDocuments, async function(item, idx) {
			const fileName = item.FileName.replace(/\.([a-zA-Z0-9]*)$/, `_${item.DocumentID}.$1`);
			const response = await getS3FileLink(fileName);
			projectDocuments[idx]['Url'] = response;
		});
		
		return res.status(200).json({ success: true, projectDocuments: projectDocuments, totalCount: totalCount });
	});
};

const getS3FileLink = async (fileName) => (
	new Promise((resolve, reject) => {		
		cfSign(fileName, (err, url) => { err ? reject(err) : resolve(url) });
	})
);

exports.createProjectDocuments = async (req, res) => {
	let params = req.body;
  let invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if(!params.documentId || !params.projectId) {
		invalidData = true;
  }

	if(params.documentId && (parseInt(params.documentId) <= 0 || isNaN(parseInt(params.documentId)))) invalidData = true;
	if(params.projectId && (parseInt(params.projectId) <= 0 || isNaN(parseInt(params.projectId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await projectDocuments.createProjectDocuments(params, (err, result, projectsDocumentId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, data: { projectsDocumentId: projectsDocumentId } });
	});
};

exports.removeProjectDocuments = async (req, res) => {
  let params = req.body;
	var invalidData = false;

	if(!params) {
		invalidData = true;
	}

  if(!params.projectsDocumentId) {
		invalidData = true;
	} 
	
	if(params.projectsDocumentId && (parseInt(params.projectsDocumentId) <= 0 || isNaN(parseInt(params.projectsDocumentId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await projectDocuments.removeProjectDocuments(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};