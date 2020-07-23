const video_query_provider = require('../providers/video_query_provider');
const sql_helper = require('./mssql_helper');

exports.getVideos = async function(roleId, callback) {
	try {
    const connection = await sql_helper.getConnection();

    query = video_query_provider.generateGetVideosQuery(roleId)

    
    result = await connection.request().query(query);
    
    connection.close();

    data = result.recordset

		callback(null, data);
	}
	catch (err) {
    console.log(err)
		callback(err, null);
	}
}