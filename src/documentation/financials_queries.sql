CREATE PROC spGetFinancialsInput
    @submissionId int

AS

SELECT groupId, groupName, accountId, accountName, value, adjustment
FROM
(
-- Current assets
SELECT  ag.id groupId, 
        ag.name groupName, 
        a.id accountId, 
        a.name accountName,
        ISNULL((SELECT ISNULL(value, 0.0) FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = @submissionId), 0) value,
        ISNULL((SELECT CASE adjustmentValue
                    WHEN NULL THEN value * adjustmentFactor
                    ELSE ISNULL(adjustmentValue, 0)
                END
                FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = @submissionId), 0) adjustment
FROM    AccountsGroups ag,
        Accounts a
WHERE   a.groupId = ag.id        
AND     a.accountTypeId = 1
AND     ag.id = 3

UNION
-- PP&E
SELECT  ag.id groupId, 
        ag.name groupName, 
        a.id accountId, 
        a.name accountName,
        ISNULL((SELECT ISNULL(value, 0.0) FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = @submissionId), 0) value,
        ISNULL((SELECT CASE adjustmentValue
                    WHEN NULL THEN value * adjustmentFactor
                    ELSE ISNULL(adjustmentValue, 0)
                END
                FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = @submissionId), 0) adjustment
FROM    AccountsGroups ag,
        Accounts a
WHERE   a.groupId = ag.id        
AND     a.accountTypeId = 1
AND     ag.id = 4

UNION
-- Other Assets
SELECT  ag.id groupId, 
        ag.name groupName, 
        a.id accountId, 
        a.name accountName,
        ISNULL((SELECT ISNULL(value, 0.0) FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = @submissionId), 0) value,
        ISNULL((SELECT CASE adjustmentValue
                    WHEN NULL THEN value * adjustmentFactor
                    ELSE ISNULL(adjustmentValue, 0)
                END
                FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = @submissionId), 0) adjustment
FROM    AccountsGroups ag,
        Accounts a
WHERE   a.groupId = ag.id        
AND     a.accountTypeId = 1
AND     ag.id = 5

UNION

-- Current Liabilities
SELECT  ag.id groupId, 
        ag.name groupName, 
        a.id accountId, 
        a.name accountName,
        ISNULL((SELECT ISNULL(value, 0.0) FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = @submissionId), 0) value,
        ISNULL((SELECT CASE adjustmentValue
                    WHEN NULL THEN value * adjustmentFactor
                    ELSE ISNULL(adjustmentValue, 0)
                END
                FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = @submissionId), 0) adjustment
FROM    AccountsGroups ag,
        Accounts a
WHERE   a.groupId = ag.id        
AND     a.accountTypeId = 1
AND     ag.id = 7

UNION

-- Non Current Liabilities
SELECT  ag.id groupId, 
        ag.name groupName, 
        a.id accountId, 
        a.name accountName,
        ISNULL((SELECT ISNULL(value, 0.0) FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = @submissionId), 0) value,
        ISNULL((SELECT CASE adjustmentValue
                    WHEN NULL THEN value * adjustmentFactor
                    ELSE ISNULL(adjustmentValue, 0)
                END
                FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = @submissionId), 0) adjustment
FROM    AccountsGroups ag,
        Accounts a
WHERE   a.groupId = ag.id        
AND     a.accountTypeId = 1
AND     ag.id = 8

UNION

-- Stockholders' Equity
SELECT  ag.id groupId, 
        ag.name groupName, 
        a.id accountId, 
        a.name accountName,
        ISNULL((SELECT ISNULL(value, 0.0) FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = @submissionId), 0) value,
        ISNULL((SELECT CASE adjustmentValue
                    WHEN NULL THEN value * adjustmentFactor
                    ELSE ISNULL(adjustmentValue, 0)
                END
                FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = @submissionId), 0) adjustment
FROM    AccountsGroups ag,
        Accounts a
WHERE   a.groupId = ag.id        
AND     a.accountTypeId = 1
AND     ag.id = 9
) D
ORDER BY groupId, accountName 
