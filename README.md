# Einstein Vision サンプルアプリ (API V2対応)

Einstein Vision を試用するために、GUIをNode.jsで実装したサンプルアプリです。Heroku Buttonでデプロイするだけで、デフォルトで用意されているモデルを使用した予測・解析を試してみることができます。

## 必要要件

 - Heroku アカウント (無償の範囲内で使えますが、Einstein Vision のアドオンを使用するため、クレジットカード情報の登録が必要です)

## 実装方法

 - Heroku ボタンを使ってください。
 - [![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

## 特徴

 - スマートフォンのブラウザで表示することで、カメラ起動→撮影→解析を試してみることが可能です。
 - Einstein Vision は入力画像の最大サイズに制限(縦横最大2000ピクセル＆ファイルサイズ最大1MBまで)があります。このため画像リサイズ処理をクライアント側で行った上でサーバーに送信し、予測・解析を行うようにしました。
 - 解析モデルを選択できるようにし、この内容は設定変数で定義できるようにしています。個別の予測・解析モデルを作成した際にも、ソースコードを再デプロイせずに選択リストに追加・使用することが可能です。
 - サーバー・クライアント共に、実装は動きを理解・説明しやすくするために、あえてシンプルにしています。実際のアプリケーション作成にあたっては、使用する言語の作法に則り、またUIフレームワークを活用するなど最適化を期待します。

## モデルの追加

個別の予測・解析モデルを作成したら、CUSTOM_MODEL_IDの値を変更することで、選択肢に出現させ利用することができます。JSON形式なので、{"追加するモデルの表示名":"モデルID"}を追加します。

```追加の仕方
{"models":[{"label":"GeneralImageClassifier","value":"GeneralImageClassifier"},{"label":"FoodImageClassifier","value":"FoodImageClassifier"},{"label":"SceneClassifier","value":"SceneClassifier"},{"label":"MultiLabelImageClassifier","value":"MultiLabelImageClassifier"},{"選択リストの表示名":"モデルID"}]}
```

## ローカルでの実行方法

環境が揃って入ればローカルで実行して試すことも可能です。ただし、Einstein Vision へのアクセス情報は、Heroku 用の Einstein Vision アドオンを追加した際に付与されるため、いずれにせよ Heroku 上でのアプリケーション作成・アドオン追加が必要です。

1. nodeを実行できるようにします。
2. ソースコードをダウンロードします。
3. 依存関係のパッケージをダウンロードします。

```
$ node install
```

4. .envファイルを作成します。

```.env
EINSTEIN_VISION_URL=[Heroku アプリケーションの Config Vars から値をコピーします]
EINSTEIN_VISION_ACCOUNT_ID=[Heroku アプリケーションの Config Vars から値をコピーします]
CUSTOM_MODEL_ID='{"models":[{"label":"GeneralImageClassifier","value":"GeneralImageClassifier"},{"label":"FoodImageClassifier","value":"FoodImageClassifier"},{"label":"SceneClassifier","value":"SceneClassifier"},{"label":"MultiLabelImageClassifier","value":"MultiLabelImageClassifier"}]}'
API_VERSION='v2'
```

5. EINSTEIN_VISION_PRIVATE_KEYの値を Heroku アプリケーションの Config Vars からコピーし、ファイルeinstein_platform.keyを作成します。

```einstein_platform.key
-----BEGIN RSA PRIVATE KEY-----
MIIEo〜
中略
-----END RSA PRIVATE KEY-----
```

6. EINSTEIN_VISION_PRIVATE_KEYを環境変数として定義します。(.envに書き込んでもうまくいかないので、この環境変数のみ個別にコマンドで定義しています)

```
$ export EINSTEIN_VISION_PRIVATE_KEY=`cat einstein_platform.key`
```

7. server.jsを実行します。

```
$ node server.js
```

8. ブラウザでアクセスします。

```
http://localhost:8081
```

## 免責事項

このサンプルコードは、あくまで機能利用の1例を示すためのものであり、コードの書き方や特定ライブラリの利用を推奨したり、機能提供を保証するものではありません。
