require('dotenv').config();

var http = require('http');
var request = require('request');

var static = require('node-static');
var file = new static.Server('./public');

var jwt = require('jsonwebtoken');

var plainHttpServer = http.createServer(function(request, response) {
    request.addListener('end', function () {
        file.serve(request, response);
    }).resume();
}).listen(process.env.PORT || 8081);

var io = require('socket.io').listen(plainHttpServer);
io.sockets.on('connection', function (socket) {
    socket.on('getPredictions', function(params, cb) {

        var url = process.env.EINSTEIN_VISION_URL + process.env.API_VERSION + '/';
        var private_key = process.env.EINSTEIN_VISION_PRIVATE_KEY
        var account_id = process.env.EINSTEIN_VISION_ACCOUNT_ID

        var reqUrl = url + 'oauth2/token';

        // JWT payload
        var rsa_payload = {
            "sub": account_id,
            "aud": reqUrl
        }

        var rsa_options = {
            header: {
                "alg": "RS256",
                "typ": "JWT"
            },
            expiresIn: '1m'
        }

        // Sign the JWT payload
        var assertion = jwt.sign(
            rsa_payload,
            private_key,
            rsa_options
        );

        var options = {
            url: reqUrl,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'accept': 'application/json'
            },
            body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${encodeURIComponent(assertion)}`
        }

        // Make the OAuth call to generate a token
        request.post(options, function(error, response, body) {
            var data = JSON.parse(body);
            console.log(data["access_token"]);

            /*
            var reqOptionsApiUsage = {
                url: url + 'apiusage',
                headers: {
                  'Authorization': 'Bearer ' + data["access_token"],
                  'Cache-Control': 'no-cache'
                }
            }
            */

            var reqUrl = url + 'vision/predict';
            var formData = {
                modelId: params.modelId,
                sampleBase64Content: params.base64img.slice(23)
            }

            var reqOptionsPrediction = {
                url: reqUrl,
                headers: {
                    'Authorization': 'Bearer ' + data["access_token"],
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'multipart/form-data'
                },
                formData: formData
            }

            request.post(reqOptionsPrediction, function(error, response, body) {
                console.log(body);
                cb(body);
            })

/*
                var reqUrl = url + 'language/intent';
                if (params.modelId == "CommunitySentiment") {
                    reqUrl = url + 'language/sentiment';
                }

                var formData = {
                    modelId: params.modelId,
                    document: text
                }
                var reqOptionsPrediction = {
                    url: reqUrl,
                    headers: {
                        'Authorization': 'Bearer ' + data["access_token"],
                        'Cache-Control': 'no-cache',
                        'Content-Type': 'multipart/form-data'
                    },
                    formData: formData
                }

                request.post(reqOptionsPrediction, function(error, response, body) {
                    console.log(body);
                    cb(body);
                })
*/
        });

    });
    socket.on('getModels', function(cb) {
        cb(process.env.CUSTOM_MODEL_ID || '{"models":[{"label":"GeneralImageClassifier","value":"GeneralImageClassifier"}]}');
    });
});
