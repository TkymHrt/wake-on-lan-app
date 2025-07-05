# Wake on LAN App

ネットワーク内のデバイスをWebブラウザから簡単に起動できるWake on LAN（WOL）アプリケーションです。UIからデバイス管理と起動操作を行うことができます。

<div align="center">
  <img src="https://github.com/user-attachments/assets/c27172a8-8417-4944-989f-70c708da8ddd" width="600">
</div>

## 機能

- **Webインターフェース**
  シンプルなUIでWOLパケットを簡単に送信

- **デバイス履歴管理**
  一度使用したデバイス情報を自動保存し、ワンクリックで再起動

- **デバイス状態監視**
  IPアドレスが設定されているデバイスのオンライン状態をリアルタイムで確認

- **高速な状態チェック**
  ping、各種ポート（SSH、HTTP、RDPなど）を使った状態確認

- **自動デプロイ対応**
  GitHub ActionsによるCI/CDパイプラインで継続的インテグレーション

## 技術スタック

### フロントエンド
- **[Preact](https://preactjs.com/)** - 軽量なReact互換ライブラリ
- **[TypeScript](https://www.typescriptlang.org/)** - 型安全なJavaScript
- **[Vite](https://vitejs.dev/)** - 高速なビルドツール
- **[Biome](https://biomejs.dev/)** - 統合型リンター・フォーマッター
- **[react-toastify](https://fkhadra.github.io/react-toastify/)** - 通知システム

### バックエンド
- **[Go](https://golang.org/)** - 高性能なシステムプログラミング言語

### 開発・運用
- **[GitHub Actions](https://github.com/features/actions)** - CI/CDパイプライン
- **[pnpm](https://pnpm.io/)** - 高速なパッケージマネージャー

## 📋 必要な環境

- **Node.js** 20.x以上
- **Go** 1.22.2以上
- **pnpm**

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/TkymHrt/wake-on-lan-app.git
cd wake-on-lan-app
```

### 2. フロントエンドのセットアップ

```bash
cd frontend
pnpm install
```

### 3. バックエンドの依存関係確認

```bash
cd backend
go mod download
go mod verify
```

## 開発環境での実行

### フロントエンド開発サーバー（開発時のみ）

```bash
cd frontend
pnpm run dev
```

### バックエンドサーバー

```bash
cd backend
go run main.go
```

サーバーはデフォルトで `http://localhost:8080` で起動します。

### 🔧 開発時のコマンド

```bash
# フロントエンド
cd frontend
pnpm run lint      # コードの静的解析
pnpm run format    # コードフォーマット
pnpm run check     # 統合チェック（lint + format）

# バックエンド
cd backend
go vet ./...       # 静的解析
go fmt ./...       # コードフォーマット
go test ./...      # テスト実行
```

## 本番環境用ビルド

### 1. フロントエンドビルド

```bash
cd frontend
pnpm run build
```

### 2. バックエンドビルド

```bash
cd backend
go build -o wol-server
```

### 3. 実行

```bash
# バックエンドがフロントエンドファイルも配信します
cd backend
./wol-server -port 8080 -host 0.0.0.0
```

## CI/CD パイプライン

本プロジェクトはGitHub ActionsによるCI/CDパイプラインを含んでいます

### 自動化フロー

1. **コード品質チェック**
   - Biome による静的解析・フォーマットチェック
   - TypeScript型チェック
   - Go vet による静的解析

2. **ビルド検証**
   - フロントエンド・バックエンド個別ビルド
   - アーティファクト生成と検証

3. **統合テスト**
   - 本番同等環境でのサーバー起動テスト
   - API エンドポイント疎通確認

4. **セキュリティスキャン**
   - npm audit による脆弱性チェック
   - govulncheck による Go脆弱性スキャン

5. **自動デプロイ** (mainブランチプッシュ時)
   - systemdサービスとしての自動デプロイ
   - ゼロダウンタイムデプロイメント

## 使い方

1. **デバイス情報の入力**
   - MACアドレス（必須）: `AA:BB:CC:DD:EE:FF` 形式
   - デバイス名（任意）: 識別しやすい名前
   - IPアドレス（任意）: 状態監視用

2. **デバイスの起動**
   - 「起動する」ボタンをクリック
   - WOLパケットが送信されます

3. **履歴からの再起動**
   - 過去に使用したデバイスが履歴に表示
   - 「起動」ボタンで即座に再起動可能

4. **状態確認**
   - IPアドレスが設定されたデバイスは状態アイコンで確認
   - 🟢 オンライン / 🔴 オフライン

## 🔧 設定オプション

### サーバー起動オプション

```bash
./wol-server -port 8080 -host 0.0.0.0
```

- `-port`: 待受ポート（デフォルト: 8080）
- `-host`: バインドアドレス（デフォルト: 0.0.0.0）

### API エンドポイント

- `POST /api/wake?mac=AA:BB:CC:DD:EE:FF` - WOLパケット送信
- `GET /api/status?ip=192.168.1.100` - デバイス状態確認

## 本番デプロイ

GitHub Actionsによる自動デプロイでは以下が自動実行されます：

- `/opt/wake-on-lan/` への配置
- systemdサービスの作成・起動
- サービスの自動起動設定

デプロイ後は `http://localhost:8080` でアプリケーションにアクセスできます。
