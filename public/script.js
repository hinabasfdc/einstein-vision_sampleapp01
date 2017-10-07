var model = document.getElementById('model');
var results = document.getElementById('results');

//画像の最大ピクセル数およびデフォルトの縦横比
var targetWidth = 1024;
var targetHeight = 1024;
var ratio = 3/4;

/****
 * ファイルがドロップされた時の処理
 ****/
function drop_handler(ev) {
    ev.preventDefault();

    var dt = ev.dataTransfer;
    var file;
    //itemsが存在する場合はitemsから、存在しない場合はfilesから実態を取得
    if (dt.items) {
        if (dt.items[0].kind == "file") {
            file = dt.items[0].getAsFile();
        }
    } else {
        file = dt.files[i].getAsFile();
    }

    //画像描画ロジックにまわす
    drawImage(file);
}

//ファイルがドラッグ中の処理
function dragover_handler(ev) {
    ev.preventDefault();
}

/****
 * カメラorファイルから画像を読み込み、サイズを縮小した上で表示
 ****/
function drawImage(file) {

    //fileがまだない場合(ドロップ処理から来た場合ではない)は本文のinputからファイルを取得
    if (!file){
      file = document.getElementById('file-upload-input-01').files[0];
    }

    //読み込むファイルを取得&画像ファイルでなければファンクション終了
    if (!file.type.match(/^image\/(png|jpeg|gif)$/)) return;

    //結果エリアの表示内容を空に
    results.innerHTML = '';

    var image = new Image();
    var reader = new FileReader();

    //ファイル読み込み後のアクションを定義
    reader.onload = function(evt) {

        //画像読み込み後のアクションを定義
        //指定したサイズより大きければ、指定サイズになるようにリサイズする
        image.onload = function() {

            //HTML5 CANVASオブジェクトを取得
            var canvas = document.getElementById('cvs');
            var ctx = canvas.getContext('2d');

            var w = image.width;
            var h = image.height;

            if (w > targetWidth || h > targetHeight) {
                if (w > h) {
                    ratio = targetWidth / w;
                    w = targetWidth;
                    h = h * ratio;
                } else {
                    ratio = targetHeight / h;
                    h = targetHeight;
                    w = w * ratio;
                }
            }

            //CANVASのサイズをリサイズ後のサイズに合わせた後に描画実行
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(image, 0, 0, w, h);

            //表示用のイメージオブジェクトに、リサイズした画像データを転記
            document.getElementById('img_target').src = canvas.toDataURL('image/jpeg');
        }
        //画像ファイルをimgオブジェクトのソースに指定
        image.src = evt.target.result;
    }
    //ファイルを読み込み
    reader.readAsDataURL(file);
}

/****
 * 画像をクリック or タップしたら右に90度回転
 ****/
function rotateImage() {

    //CANVASオブジェクトを取得
    var canvas = document.getElementById('cvs');
    var ctx = canvas.getContext('2d');
    var image = new Image();

        image.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            canvas.width = image.height;
            canvas.height = image.width;

            ctx.rotate(90 * Math.PI / 180);
            ctx.translate(0, -image.height);
            ctx.drawImage(image, 0, 0);
            ctx.restore();

            document.getElementById('img_target').src = canvas.toDataURL('image/jpeg');
      }
    image.src = document.getElementById('img_target').src;
}

/****
 * モデルの選択リストを、サーバーから取得したJSONの値をもとに更新する
 ****/
function setModels(models) {
    var buf = JSON.parse(models);
    var select = document.getElementById('model');

    while (select.childNodes.length > 0) {
        select.removeChild(select.firstChild);
    }

    for (var i = 0; i < buf['models'].length; i++) {
        var option = document.createElement("option");
        option.text = buf['models'][i].label;
        option.value = buf['models'][i].value;
        select.appendChild(option);
    }
}

/****
 * 解析結果をテーブル形式で描画する
 ****/
function setResults(s) {
    var buf = JSON.parse(s);
    //console.log(buf);

    //識別結果がある場合はその内容を表示。ない場合はレスポンスを結果領域に表示
    if(buf['probabilities']) {
      var num = buf['probabilities'].length;
      //最大数を10までに限定
      if (num > 10) {num = 10;}

      var o = '<table class="slds-table slds-table_bordered slds-table_cell-buffer slds-table_striped slds-p-around_medium">';
      o += '<thead><tr class="slds-text-title_caps"><th>Label</th><th>Probability</th></tr></thead><tbody>';
      for (var i = 0; i < num; i++) {
          o += '<tr><td class="slds-cell-wrap">' + buf['probabilities'][i]['label'] + '</td><td class="slds-cell-wrap">' + buf['probabilities'][i]['probability'] + "</td>";
      }
      o += "</tbody></table>";
      results.innerHTML = o;
    }else{
      results.innerHTML = JSON.stringify(s);
    }
}

/****
 * 画像をデータ化し、サーバー側のメソッドを呼び出す
 ****/
function getPredictions() {
    //通信中であることを示すアニメーションを表示
    results.innerHTML = '<div style="height: 6rem; position: relative;"><div role="status" class="slds-spinner slds-spinner_medium"><span class="slds-assistive-text">Loading</span><div class="slds-spinner__dot-a"></div><div class="slds-spinner__dot-b"></div></div></div>';
    var canvas = document.getElementById('cvs');

    socket.emit('getPredictions', {
        modelId: model.value,
        base64img: canvas.toDataURL('image/jpeg')
    }, function(res) {
        setResults(res);
    });
}

/****
 * ソケット接続を有効にし、モデルの一覧を取得する
 ****/
var socket = io.connect('/');
socket.on('connect', function() {
    socket.emit('getModels', setModels);
});
