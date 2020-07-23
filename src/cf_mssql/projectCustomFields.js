const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const projectCustomFieldsQueryProvider = require('../cf_providers/projectcustomfields_query_provider');

exports.getProjectCustomFields = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
  let result = {};
  let processedResult = [];	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = projectCustomFieldsQueryProvider.generateProjectCustomFieldsQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		  //console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = projectCustomFieldsQueryProvider.generateProjectCustomFieldsQuery(params);
			countResult = await connection.request().query(query);
			
			if(countResult.recordset.length > 0)
				totalCount = countResult.recordset.length;
		}
		//console.log('totalCount: '+ totalCount)
    connection.close();		
    
    //console.log('Result: '+ JSON.stringify(result.recordset, 2, 2))
    processedResult = await processCustomFieldsResult(result.recordset, params);
    
    //console.log('Result: '+ JSON.stringify(processedResult, 2, 2))
		callback(null, processedResult, totalCount);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

const processCustomFieldsResult = async (customFields, params) => {
  return Object.values(
    customFields.reduce((acc, obj) => {
      acc[obj.ProjectId] = acc[obj.ProjectId] || {projectId: obj.ProjectId, customFields: []};
      acc[obj.ProjectId].customFields.push({
        customFieldId: obj.CustomFieldId,
        customFieldName: obj.CustomFieldName,
        fieldValue: obj.FieldValue
      });
      return acc;
    },{})
  ).sort((a, b) => {
    return (params.orderDirection === 'ASC')
      ? a[params.orderBy] - b[params.orderBy]
      : b[params.orderBy] - a[params.orderBy]
  });
}


exports.getProjectCustomFieldsByProjectId = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
  let result = {};
  let processedResult = [];	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = projectCustomFieldsQueryProvider.generateProjectCustomFieldsQueryByProjectId(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		  //console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = projectCustomFieldsQueryProvider.generateProjectCustomFieldsQueryByProjectId(params);
			countResult = await connection.request().query(query);
			
			if(countResult.recordset.length > 0)
				totalCount = countResult.recordset.length;
		}
		//console.log('totalCount: '+ totalCount)
    connection.close();		
    
    //console.log('Result: '+ JSON.stringify(result.recordset, 2, 2))
    //processedResult = await processCustomFieldsResult(result.recordset, params);
    
    //console.log('Result: '+ JSON.stringify(processedResult, 2, 2))
		callback(null, result.recordset, totalCount);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};


exports.createProjectCustomFields = async (params, callback) => {
  const connection = await sql_helper.getConnection();
  let error = false;

  // First, remove all projectCustomFields
  let query = projectCustomFieldsQueryProvider.generateProjectCustomFieldsDeleteQuery(params.projectId);
  await connection.request().query(query);
  
  params.customFields.map(async customField => {    
    let customFieldObj = {
      projectId: params.projectId,
      customFieldId: customField.customFieldId,
      fieldValue: customField.fieldValue
    };
    //console.log(customFieldObj);

    try {
      let query = projectCustomFieldsQueryProvider.generateProjectCustomFieldsInsertQuery(customFieldObj);
      //console.log(query);
      await connection.request().query(query);
    }
    catch(err) {
      console.log(err);
      error = true;      
    }
  });
  
  (!error) 
    ? callback(null, true)
    : callback(err, null);
};