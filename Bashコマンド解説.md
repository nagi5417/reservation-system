# Bashコマンド解説

このドキュメントは、開発中に使用した主要なBashコマンドの解説です。

---

## 📋 目次

1. [APIテスト・ネットワーク](#1-apiテストネットワーク)
2. [Docker操作](#2-docker操作)
3. [プロセス管理](#3-プロセス管理)
4. [ファイル検索・テキスト検索](#4-ファイル検索テキスト検索)
5. [ログ確認](#5-ログ確認)
6. [データベース操作](#6-データベース操作)
7. [ビルド・実行](#7-ビルド実行)
8. [その他の便利なコマンド](#8-その他の便利なコマンド)
9. [EC2デプロイ](#9-ec2デプロイ)
10. [Git操作](#10-git操作)

---

## 1. APIテスト・ネットワーク

### curl - HTTPリクエスト送信

**基本構文：**
```bash
curl [オプション] URL
```

#### 例1: GETリクエスト
```bash
curl http://localhost:8080/api/slots
```
**意味：**
- `http://localhost:8080/api/slots` にGETリクエストを送信
- レスポンスをコンソールに表示

#### 例2: GETリクエスト（整形付き）
```bash
curl -s http://localhost:8080/api/slots | python3 -m json.tool
```
**意味：**
- `-s`: サイレントモード（進捗バーを非表示）
- `|`: パイプ（前のコマンドの出力を次のコマンドに渡す）
- `python3 -m json.tool`: JSONを見やすく整形

#### 例3: POSTリクエスト
```bash
curl -X POST http://localhost:8080/api/reservations \
  -H "Content-Type: application/json" \
  -d '{"slotId": 3, "notes": "テスト予約"}'
```
**意味：**
- `-X POST`: POSTメソッドを指定
- `-H`: ヘッダーを指定
- `-d`: リクエストボディ（データ）を指定
- `\`: 行を継続（長いコマンドを複数行に分割）

#### 例4: DELETEリクエスト
```bash
curl -X DELETE http://localhost:8080/api/reservations/1
```
**意味：**
- `-X DELETE`: DELETEメソッドを指定

### よく使うオプション

| オプション | 意味 | 例 |
|-----------|------|-----|
| `-X メソッド` | HTTPメソッドを指定 | `-X POST`, `-X DELETE` |
| `-H "ヘッダー"` | HTTPヘッダーを指定 | `-H "Content-Type: application/json"` |
| `-d "データ"` | リクエストボディを指定 | `-d '{"key": "value"}'` |
| `-s` | サイレントモード | `-s` |
| `-i` | レスポンスヘッダーも表示 | `-i` |
| `-o ファイル` | 出力をファイルに保存 | `-o output.txt` |

### lsof - ポート確認

**基本構文：**
```bash
lsof -i :ポート番号
```

#### 例: ポート5432を使用しているプロセスを確認
```bash
lsof -i :5432
```
**意味：**
- ポート5432を使用しているプロセスを表示
- PostgreSQLが起動しているか確認する時に使用

**出力例：**
```
COMMAND   PID  USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
postgres 1234 user   5u  IPv4  12345      0t0  TCP *:postgresql (LISTEN)
```

---

## 2. Docker操作

### docker compose ps - コンテナの状態確認

```bash
docker compose ps
```
**意味：**
- 現在のDocker Composeプロジェクトのコンテナ一覧を表示
- 各コンテナの状態（Up、Exited）を確認

**出力例：**
```
NAME                   IMAGE                    STATUS
reservation-postgres   postgres:16-alpine       Up 2 weeks
reservation-mailhog    mailhog/mailhog:latest   Up 2 weeks
```

### docker compose up - コンテナ起動

```bash
docker compose up -d
```
**意味：**
- `-d`: デタッチモード（バックグラウンドで実行）
- docker-compose.ymlに定義されたコンテナを起動

### docker compose down - コンテナ停止

```bash
docker compose down
```
**意味：**
- すべてのコンテナを停止・削除

### docker exec - コンテナ内でコマンド実行

```bash
docker exec コンテナ名 コマンド
```

#### 例: PostgreSQLのテーブル構造確認
```bash
docker exec reservation-postgres psql -U reservation_user -d reservation_db -c "\d reservations"
```
**意味：**
- `reservation-postgres`: コンテナ名
- `psql`: PostgreSQLクライアント
- `-U reservation_user`: ユーザー名
- `-d reservation_db`: データベース名
- `-c "\d reservations"`: 実行するコマンド（テーブル構造表示）

#### よく使うDockerコマンド

| コマンド | 意味 |
|---------|------|
| `docker ps` | 実行中のコンテナ一覧 |
| `docker ps -a` | すべてのコンテナ一覧（停止中も含む） |
| `docker logs コンテナ名` | コンテナのログを表示 |
| `docker stop コンテナ名` | コンテナを停止 |
| `docker start コンテナ名` | コンテナを起動 |
| `docker rm コンテナ名` | コンテナを削除 |

---

## 3. プロセス管理

### ps aux - プロセス一覧表示

```bash
ps aux
```
**意味：**
- 実行中のすべてのプロセスを表示
- `a`: すべてのユーザーのプロセス
- `u`: ユーザー名を表示
- `x`: 制御端末を持たないプロセスも表示

#### 例: Springプロセスを検索
```bash
ps aux | grep spring
```
**意味：**
- `|`: パイプ（前のコマンドの出力を次のコマンドに渡す）
- `grep spring`: "spring"を含む行のみ表示

**出力例：**
```
user  13632  1.5  2.3 /usr/bin/java -jar spring-boot.jar
```

### grep を使ったプロセス検索パターン

```bash
ps aux | grep -i spring | grep -v grep
```
**意味：**
- `grep -i spring`: 大文字小文字を区別せず"spring"を検索
- `grep -v grep`: "grep"自身を除外

### kill - プロセスを停止

```bash
kill PID
```
**意味：**
- 指定したプロセスID（PID）のプロセスを停止
- デフォルトはSIGTERM（正常終了）

#### 例: プロセス13632を停止
```bash
kill 13632
```

#### 強制終了（SIGKILL）
```bash
kill -9 13632
```
**意味：**
- `-9`: SIGKILL（強制終了）
- プロセスが応答しない場合に使用

### pkill - プロセス名で停止

```bash
pkill -f "パターン"
```
**意味：**
- プロセス名のパターンマッチで停止
- `-f`: コマンドライン全体を検索

#### 例: Javaプロセスを停止
```bash
pkill -f "java.*reservation"
```
**意味：**
- "java"で始まり"reservation"を含むプロセスを停止

### プロセスの探し方と停止の流れ

```bash
# 1. プロセスを探す
ps aux | grep spring

# 2. PIDを確認（例: 13632）
# 3. プロセスを停止
kill 13632

# または一気に停止
pkill -f "spring"
```

---

## 4. ファイル検索・テキスト検索

### find - ファイル検索

```bash
find パス -name "パターン"
```

#### 例1: ファイル名で検索
```bash
find . -name "*.java"
```
**意味：**
- `.`: 現在のディレクトリ以下を検索
- `-name "*.java"`: .javaで終わるファイルを検索

#### 例2: ファイルを見つけて内容表示
```bash
find . -name "ReservationService.java" -exec cat {} \;
```
**意味：**
- `-exec cat {} \;`: 見つけたファイルに対して`cat`を実行
- `{}`: 見つかったファイル名が入る
- `\;`: execの終わり

### grep - テキスト検索

```bash
grep "検索文字列" ファイル
```

#### 例1: ファイル内を検索
```bash
grep "CONFIRMED" ReservationStatus.java
```
**意味：**
- "CONFIRMED"を含む行を表示

#### 例2: ディレクトリ内を再帰検索
```bash
grep -r "CONFIRMED" src/
```
**意味：**
- `-r`: 再帰的に検索（サブディレクトリも含む）
- `src/`: 検索対象ディレクトリ

#### 例3: 検索結果の前後行も表示
```bash
grep -A 5 "Exception" backend.log
```
**意味：**
- `-A 5`: マッチした行の後5行も表示
- `-B 5`: マッチした行の前5行も表示
- `-C 5`: マッチした行の前後5行も表示

#### 例4: マッチしない行を表示
```bash
grep -v "grep" output.txt
```
**意味：**
- `-v`: マッチしない行を表示（反転）

### よく使うgrepオプション

| オプション | 意味 | 例 |
|-----------|------|-----|
| `-i` | 大文字小文字を区別しない | `grep -i error log.txt` |
| `-r` | 再帰的に検索 | `grep -r "text" src/` |
| `-n` | 行番号を表示 | `grep -n "error" file.txt` |
| `-l` | ファイル名のみ表示 | `grep -l "pattern" *.txt` |
| `-c` | マッチした行数を表示 | `grep -c "error" log.txt` |
| `-A N` | マッチ行の後N行も表示 | `grep -A 3 "error" log.txt` |
| `-B N` | マッチ行の前N行も表示 | `grep -B 3 "error" log.txt` |
| `-C N` | マッチ行の前後N行も表示 | `grep -C 3 "error" log.txt` |
| `-v` | マッチしない行を表示 | `grep -v "grep" output.txt` |

---

## 5. ログ確認

### tail - ファイルの末尾表示

```bash
tail ファイル
```
**意味：**
- ファイルの最後の10行を表示

#### 例1: 行数指定
```bash
tail -50 backend.log
```
**意味：**
- `-50`: 最後の50行を表示

#### 例2: リアルタイム監視
```bash
tail -f backend.log
```
**意味：**
- `-f`: ファイルの末尾を監視し続ける
- 新しい行が追加されるとリアルタイムで表示
- Ctrl+Cで終了

#### 例3: パイプとの組み合わせ
```bash
tail -100 backend.log | grep "ERROR"
```
**意味：**
- 最後の100行から"ERROR"を含む行のみ表示

### head - ファイルの先頭表示

```bash
head -20 output.txt
```
**意味：**
- 最初の20行を表示

---

## 6. データベース操作

### psql - PostgreSQLクライアント

```bash
psql -U ユーザー名 -d データベース名 -c "SQL文"
```

#### 例1: テーブル構造確認
```bash
docker exec reservation-postgres psql -U reservation_user -d reservation_db -c "\d reservations"
```
**意味：**
- `\d テーブル名`: テーブルの構造を表示

#### 例2: SQL実行
```bash
docker exec reservation-postgres psql -U reservation_user -d reservation_db -c "SELECT * FROM reservations;"
```

#### よく使うpsqlメタコマンド

| コマンド | 意味 |
|---------|------|
| `\l` | データベース一覧 |
| `\dt` | テーブル一覧 |
| `\d テーブル名` | テーブル構造表示 |
| `\du` | ユーザー一覧 |
| `\q` | 終了 |

---

## 7. ビルド・実行

### ./gradlew - Gradleコマンド

```bash
./gradlew タスク名
```

#### 例1: コンパイル
```bash
./gradlew compileJava
```
**意味：**
- Javaソースコードをコンパイル

#### 例2: Spring Boot起動
```bash
./gradlew bootRun
```
**意味：**
- Spring Bootアプリケーションを起動

#### 例3: ビルド
```bash
./gradlew build
```
**意味：**
- プロジェクト全体をビルド（コンパイル、テスト、パッケージング）

#### 例4: テスト実行
```bash
./gradlew test
```

### nohup - バックグラウンド実行

```bash
nohup コマンド > ログファイル 2>&1 &
```

#### 例: Spring Bootをバックグラウンド起動
```bash
nohup ./gradlew bootRun > backend.log 2>&1 &
```
**意味：**
- `nohup`: ターミナルを閉じても実行を継続
- `> backend.log`: 標準出力をbackend.logにリダイレクト
- `2>&1`: 標準エラー出力も標準出力にリダイレクト
- `&`: バックグラウンドで実行

---

## 8. その他の便利なコマンド

### sleep - 待機

```bash
sleep 秒数
```

#### 例: 30秒待機
```bash
sleep 30
```

#### 例: コマンドチェーンで使用
```bash
sleep 30 && curl http://localhost:8080/api/slots
```
**意味：**
- `&&`: 前のコマンドが成功したら次を実行
- 30秒待ってからAPIを呼び出す

### cat - ファイル内容表示

```bash
cat ファイル名
```

#### 例: 行番号付きで表示
```bash
cat -n ファイル名
```

### awk - テキスト処理

```bash
ps aux | grep spring | awk '{print $2}'
```
**意味：**
- `awk '{print $2}'`: 2列目（PID）のみ表示
- `$1`: 1列目、`$2`: 2列目、...

### wc - 行数・文字数カウント

```bash
wc -l ファイル名
```
**意味：**
- `-l`: 行数をカウント

---

## 🔗 パイプとリダイレクト

### パイプ（|）

```bash
コマンド1 | コマンド2
```
**意味：**
- コマンド1の出力をコマンド2の入力に渡す

**例：**
```bash
ps aux | grep spring | awk '{print $2}' | head -1
```
**処理の流れ：**
1. `ps aux` → 全プロセス表示
2. `grep spring` → "spring"を含む行のみ
3. `awk '{print $2}'` → 2列目（PID）のみ
4. `head -1` → 最初の1行のみ

### リダイレクト

#### 出力リダイレクト（>）
```bash
コマンド > ファイル
```
**意味：**
- コマンドの出力をファイルに書き込む（上書き）

#### 追記リダイレクト（>>）
```bash
コマンド >> ファイル
```
**意味：**
- コマンドの出力をファイルに追記

#### エラー出力リダイレクト（2>）
```bash
コマンド 2> error.log
```
**意味：**
- エラー出力のみファイルに書き込む

#### 標準出力とエラー出力を両方リダイレクト
```bash
コマンド > output.log 2>&1
```
**意味：**
- `2>&1`: エラー出力（2）を標準出力（1）にリダイレクト
- 結果として両方が`output.log`に書き込まれる

---

## 🎯 実践的なコマンド例

### 1. APIのヘルスチェック

```bash
curl -s http://localhost:8080/api/slots | python3 -m json.tool | head -20
```
**意味：**
- APIを呼び出してJSONを整形し、最初の20行のみ表示

### 2. Springプロセスの再起動

```bash
# 1. プロセスを見つける
ps aux | grep spring | grep -v grep

# 2. PIDを確認（例: 13632）

# 3. 停止
kill 13632

# 4. 起動
nohup ./gradlew bootRun > backend.log 2>&1 &

# 5. ログ監視
tail -f backend.log
```

### 3. データベースのチェック制約確認

```bash
docker exec reservation-postgres psql -U reservation_user -d reservation_db -c "\d reservations" | grep -A 5 "Check constraints"
```

### 4. エラーログの抽出

```bash
tail -200 backend.log | grep -B 5 -A 10 "Exception" | tail -30
```
**意味：**
- 最後の200行から
- "Exception"を含む行の前5行・後10行を表示
- さらにその最後の30行のみ表示

### 5. 起動確認（待機付き）

```bash
sleep 30 && curl -s http://localhost:8080/api/slots | python3 -m json.tool 2>/dev/null || echo "まだ起動中..."
```
**意味：**
- 30秒待機
- APIを呼び出してJSON整形
- `2>/dev/null`: エラー出力を破棄
- `||`: 前のコマンドが失敗したら次を実行
- 失敗したら「まだ起動中...」と表示

---

## 💡 よく使うショートカットキー

| キー | 動作 |
|------|------|
| Ctrl+C | 実行中のコマンドを中断 |
| Ctrl+Z | 実行中のコマンドを一時停止 |
| Ctrl+D | 入力終了（EOFを送信） |
| Ctrl+L | 画面クリア（`clear`と同じ） |
| ↑/↓ | コマンド履歴を辿る |
| Tab | コマンド・ファイル名補完 |

---

## 📚 参考資料

### オンラインマニュアル

コマンドの詳細は`man`コマンドで確認できます：

```bash
man コマンド名
```

**例：**
```bash
man curl
man grep
man docker
```

### ヘルプオプション

多くのコマンドは`--help`オプションでヘルプを表示できます：

```bash
curl --help
docker --help
./gradlew --help
```

---

## 🎓 学習のポイント

### 1. パイプを活用する

複数のコマンドを組み合わせることで、複雑な処理が簡単に実現できます。

```bash
# 悪い例（複数回実行）
ps aux > temp.txt
grep spring temp.txt > temp2.txt
awk '{print $2}' temp2.txt
rm temp.txt temp2.txt

# 良い例（パイプで一気に処理）
ps aux | grep spring | awk '{print $2}'
```

### 2. grepの活用

ログ確認やコード検索に必須のコマンドです。

```bash
# よく使うパターン
grep -r "検索文字列" ディレクトリ/
grep -i "error" ログファイル
grep -v "除外文字列" ファイル
tail -f ログファイル | grep "ERROR"
```

### 3. プロセス管理の流れ

```bash
# 1. 確認
ps aux | grep プロセス名

# 2. 停止
kill PID
# または
pkill -f "プロセス名"

# 3. 起動
nohup コマンド > log.txt 2>&1 &

# 4. 監視
tail -f log.txt
```

---

## 9. EC2デプロイ

### SSH接続

```bash
ssh -i 秘密鍵ファイル ユーザー名@ホスト
```

#### 例: EC2インスタンスに接続
```bash
ssh -i ~/.ssh/nagi5417-key.pem ec2-user@18.183.192.121
```
**意味：**
- `-i ~/.ssh/nagi5417-key.pem`: 秘密鍵ファイルを指定
- `ec2-user`: EC2のデフォルトユーザー（Amazon Linux）
- `18.183.192.121`: EC2のパブリックIPアドレス

### SCP - ファイル転送

```bash
scp -i 秘密鍵 ローカルファイル ユーザー@ホスト:リモートパス
```

#### 例: JARファイルをEC2に転送
```bash
scp -i ~/.ssh/nagi5417-key.pem ./build/libs/reservation-0.0.1-SNAPSHOT.jar ec2-user@18.183.192.121:~/reservation.jar
```
**意味：**
- ローカルのJARファイルをEC2の`~/reservation.jar`にコピー

#### 例: EC2からローカルにファイルをダウンロード
```bash
scp -i ~/.ssh/nagi5417-key.pem ec2-user@18.183.192.121:~/app.log ./local-app.log
```

### systemd - サービス管理

#### サービスの状態確認
```bash
sudo systemctl status reservation
```

#### サービスの起動
```bash
sudo systemctl start reservation
```

#### サービスの停止
```bash
sudo systemctl stop reservation
```

#### サービスの再起動
```bash
sudo systemctl restart reservation
```

#### 自動起動の有効化
```bash
sudo systemctl enable reservation
```

#### サービスのログ確認
```bash
sudo journalctl -u reservation -f
```
**意味：**
- `-u reservation`: reservationサービスのログ
- `-f`: リアルタイムでログを追跡

### EC2デプロイの一連の流れ

```bash
# 1. ローカルでJARをビルド
./gradlew clean bootJar

# 2. JARをEC2に転送
scp -i ~/.ssh/nagi5417-key.pem ./build/libs/reservation-0.0.1-SNAPSHOT.jar ec2-user@18.183.192.121:~/reservation.jar

# 3. EC2でJARをコピーしてサービス再起動
ssh -i ~/.ssh/nagi5417-key.pem ec2-user@18.183.192.121 "sudo cp ~/reservation.jar /opt/reservation/app.jar && sudo systemctl restart reservation"

# 4. サービス状態確認
ssh -i ~/.ssh/nagi5417-key.pem ec2-user@18.183.192.121 "sudo systemctl status reservation"

# 5. APIの動作確認
curl -s http://18.183.192.121:8080/api/slots
```

### CORSプリフライト確認

```bash
curl -s -I -X OPTIONS \
  -H "Origin: https://your-frontend-domain.com" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  http://18.183.192.121:8080/api/slots
```
**意味：**
- `-I`: ヘッダーのみ表示
- `-X OPTIONS`: OPTIONSメソッド（CORSプリフライト）
- `Origin`: フロントエンドのドメインを指定
- レスポンスに`Access-Control-Allow-Origin`が含まれていればCORS設定OK

### HTTPステータスコード確認

```bash
curl -s -w "\nHTTP Status: %{http_code}\n" http://18.183.192.121:8080/api/slots
```
**意味：**
- `-w "\nHTTP Status: %{http_code}\n"`: レスポンス後にHTTPステータスコードを表示

---

## 10. Git操作

### 基本コマンド

#### 状態確認
```bash
git status
```

#### 変更をステージング
```bash
git add ファイル名
```

#### すべての変更をステージング
```bash
git add -A
```

#### コミット
```bash
git commit -m "コミットメッセージ"
```

#### 複数行のコミットメッセージ（HEREDOC使用）
```bash
git commit -m "$(cat <<'EOF'
feat: 新機能の追加

詳細な説明をここに記載

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

#### リモートにプッシュ
```bash
git push origin main
```

### 変更履歴の確認

#### コミット履歴
```bash
git log --oneline -10
```
**意味：**
- `--oneline`: 1行で表示
- `-10`: 最新10件

#### 変更差分の確認
```bash
git diff
```

#### ステージング済みの差分
```bash
git diff --staged
```

### ブランチ操作

#### ブランチ一覧
```bash
git branch
```

#### ブランチ作成・切り替え
```bash
git checkout -b 新ブランチ名
```

#### ブランチ切り替え
```bash
git checkout ブランチ名
```

### GitHub CLI（gh）

#### PRの作成
```bash
gh pr create --title "タイトル" --body "説明"
```

#### PRの一覧
```bash
gh pr list
```

#### Issueの一覧
```bash
gh issue list
```

### 実践的なGit操作フロー

```bash
# 1. 現在の状態確認
git status

# 2. 変更をステージング
git add 変更したファイル

# 3. 差分確認
git diff --staged

# 4. コミット
git commit -m "fix: バグ修正の説明"

# 5. プッシュ
git push origin main
```

---

このドキュメントを参考に、Bashコマンドを効率的に使いこなしてください！
