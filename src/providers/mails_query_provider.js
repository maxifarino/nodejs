exports.generateEmailAccountsQuery = function(ids) {
	return `SELECT firstName, lastName, mail FROM Users WHERE id IN (${ids}) `
}

exports.generateTemplateHCFieldsQuery = function(hiringClientId) {
	return `SELECT
					Name hiring_client_company_name, 
					id hiring_client_id, 
					(SELECT TOP 1 firstName FROM Users WHERE id in 
						(SELECT userId FROM Users_HiringClients WHERE hiringClientId = ${hiringClientId} AND isContact = 1)
					) hiring_client_first_name, 
					(SELECT TOP 1 lastName FROM Users WHERE id in 
						(SELECT userId FROM Users_HiringClients WHERE hiringClientId = ${hiringClientId} AND isContact = 1)
					) hiring_client_last_name,  
					(SELECT TOP 1 lastName + ' ' + firstName FROM Users WHERE id in 
						(SELECT userId FROM Users_HiringClients WHERE hiringClientId = ${hiringClientId} AND isContact = 1)
					) hiring_client_full_name, 
					phone hiring_client_phone, 
					phone2 hiring_client_mobile, 
					(SELECT TOP 1 mail FROM Users WHERE id in 
						(SELECT userId FROM Users_HiringClients WHERE hiringClientId = ${hiringClientId} AND isContact = 1)
					) hiring_client_mail, 
					RegistrationUrl hiring_client_url, 
					RegistrationUrl url_registration, 
    				'' hiring_client_logo
				FROM
				HiringClients
				WHERE id = ${hiringClientId} `;
}

exports.generateTemplateSCFieldsQuery = function(subcontractorId) {
	return `SELECT
					name subcontractor_company_name, 
					id subcontractor_id, 
				    (SELECT TOP 1 firstName FROM Users WHERE id in 
						(SELECT userId FROM Users_Subcontractors WHERE subcontractorId = 1 AND isContact = 1)
					) subcontractor_first_name, 
					(SELECT TOP 1 lastName FROM Users WHERE id in 
						(SELECT userId FROM Users_Subcontractors WHERE subcontractorId = 1 AND isContact = 1)
					) subcontractor_last_name,  
					(SELECT TOP 1 lastName + ' ' + firstName FROM Users WHERE id in 
						(SELECT userId FROM Users_Subcontractors WHERE subcontractorId = 1 AND isContact = 1)
					) subcontractor_full_name, 
					contactphone subcontractor_phone, 
					(SELECT TOP 1 cellPhone FROM Users WHERE id in 
						(SELECT userId FROM Users_Subcontractors WHERE subcontractorId = 1 AND isContact = 1)
					) subcontractor_mobile, 
					mainemail subcontractor_mail, 
					'' subcontractor_url, 
					'' subcontractor_status
				FROM Subcontractors
				WHERE id = ${subcontractorId} `;
}

exports.generateTemplateUserFieldsQuery = function(userId) {
	return `SELECT
						id user_id, 
						firstName user_first_name, 
						lastName user_last_name, 
						firstName + '' + lastName user_full_name, 
						phone user_phone, 
						cellPhone user_mobile,
						mail user_mail, 
					FROM Users
					WHERE id = ${userId} `;
}

exports.generateTemplateTaskFieldsQuery = function(taskId) {
	return `SELECT
					id task_id, 
					name task_name, 
					description task_description, 
					(SELECT status FROM TaskStatus WHERE id = statusId) task_status, 
					dateDue task_due_date, 
					enteredDate task_created_date, 
					(SELECT firstName + ' ' + lastName FROM Users WHERE id = EnteredByUserId) task_created_by, 
				    modifiedDate task_modified_date, 
				    (SELECT firstName + ' ' + lastName FROM Users WHERE id = ModifyByUserId) task_modified_by
				FROM Tasks
				WHERE id = ${taskId} `;
}

exports.generateTemplateCardFieldsQuery = function() {
	return `SELECT 
    '' card_holder_name, 
    '' card_type, 
    '' card_last_digits, 
    '' card_charge_amount, 
    '' card_charge_date, 
    '' card_charge_description `;
}

exports.generateTemplateMiscFieldsQuery = function() {
	return `SELECT 
    '' url_change_pass, 
    '' url_submit_form, 
    '' url_complete_form, 
    '' url_task,
    '' contact_first_name, 
    '' contact_last_name `;
}
