exports.getTemplateByNameQuery = (hiringClientId, templateName) => {
	return `SELECT TOP 1 id, subject, bodyHTML, bodyText, templateName
            FROM MessagesTemplates
            WHERE hiringClientId = ${hiringClientId} 
            AND templateName = '${templateName}' 
            ORDER BY id DESC`
}