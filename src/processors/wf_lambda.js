const http = require('http');

exports.handler = (event, context, callback) => {
    //console.log('event', event);
    //console.log('context', context);
    //console.log('callback', callback);

    var options = {
        host:  'prequal-wf.us-east-1.elasticbeanstalk.com',
        //port: '443',
        path: '/api/workflow',
        method: 'POST',
        headers: {
          'x-access-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiIyMzQyMzQyMzQyMzQyMzQiLCJjbGllbnRfc2VjcmV0IjoiZGZzZnNkZmhzZGtqZmhza2RqZmhhIiwiZXhwaXJlc19pbiI6Ijk5OTk5OTkiLCJzY29wZSI6bnVsbCwiaWF0IjoxNTYyMjY2NDU4LCJleHAiOjE1NzIyNjY0NTd9.yD0TZX284ATjtDpsuZjJq3z2VPmhSlpG71-srPCywng',
        },
    };
                    
    const req = http.request(options, (res) => {
        let body = '';
        console.log('Status:', res.statusCode);
        console.log('Headers:', JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log('Successfully processed HTTPS response');
            // If we know it's JSON, parse it
            if (res.headers['content-type'] === 'application/json') {
                body = JSON.parse(body);
            }
            callback(null, body);
        });
    });
    req.on('error', callback);
    //req.write(JSON.stringify(event.data));
    req.end();
};