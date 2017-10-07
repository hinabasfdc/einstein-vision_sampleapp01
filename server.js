//ローカル実行用(Herokuのみで使うならば不要)
require('dotenv').config();

//各種ライブラリの読み込み
var http = require('http');
var request = require('request');
var static = require('node-static');
var file = new static.Server('./public');
var jwt = require('jsonwebtoken');

//HTTPサーバーの生成(ポートの指定がなければ8081で起動(ローカルを想定))
var plainHttpServer = http.createServer(function(request, response) {
    request.addListener('end', function () {
        file.serve(request, response);
    }).resume();
}).listen(process.env.PORT || 8081);

//Socket.ioによるメソッドコールを行う
var io = require('socket.io').listen(plainHttpServer);
io.sockets.on('connection', function (socket) {

    //予測・解析を実行するメソッド
    socket.on('getPredictions', function(params, cb) {

        //OAuthトークンを取得するための情報を組み立てていく
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

        //リクエストの組み立て
        var options = {
            url: reqUrl,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'accept': 'application/json'
            },
            body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${encodeURIComponent(assertion)}`
        }

        //組み立てたリクエスト文をPOSTで送信
        //レンスポンスが返ってきたらファンクション内を実行
        request.post(options, function(error, response, body) {

            //アクセストークンを含むJSONレスポンスをオブジェクトにパース
            var data = JSON.parse(body);
            //console.log(data["access_token"]);

            var reqUrl = url + 'vision/predict';
            //Multipart-Formで送るので渡されてきたモデルIDとbase64でエンコードされた画像データをFormデータ化準備
            var formData = {
                modelId: params.modelId,
                sampleBase64Content: params.base64img.slice(23)
            }

            //予測・解析を行うリクエスト文を組み立て
            var reqOptionsPrediction = {
                url: reqUrl,
                headers: {
                    'Authorization': 'Bearer ' + data["access_token"],
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'multipart/form-data'
                },
                formData: formData
            }

            //組み立てたリクエスト文を送信
            request.post(reqOptionsPrediction, function(error, response, body) {
                //console.log(body);

                //引数として渡されてきたコールバック関数に、返り値のJSONを渡して呼び出し
                cb(body);
            })

        });

    });

    //環境変数からモデルIDのJSONを取得し返す
    socket.on('getModels', function(cb) {
        cb(process.env.CUSTOM_MODEL_ID || '{"models":[{"label":"GeneralImageClassifier","value":"GeneralImageClassifier"}]}');
    });
});
