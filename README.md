# Wake on LAN App

Webブラウザから Wake on LAN (WOL) を実行し、ネットワーク内のデバイスをリモートで起動できるアプリケーションです。

<div align="center">
  <img src="https://github.com/user-attachments/assets/c27172a8-8417-4944-989f-70c708da8ddd" width="600">
</div>

## 特徴 (Features)

*   **シンプルなWebインターフェース:** 直感的な操作で、簡単にWOLパケットを送信できます。
*   **デバイス管理:** MACアドレス、IPアドレス、デバイス名を登録して、複数のデバイスを管理できます。
*   **リモート起動:** Webブラウザからネットワーク内のデバイスを起動できます。

## 技術スタック (Tech Stack)

### フロントエンド (Frontend)

*   **React:** ユーザーインターフェース構築のためのJavaScriptライブラリ
*   **Vite:** 高速な開発環境とビルドツール

### バックエンド (Backend)

*   **Go:** 高パフォーマンスなバックエンド処理


## 必要条件 (Prerequisites)

*   **Node.js:** JavaScript実行環境 (npm が利用可能であること)
*   **Go:** Go言語実行環境

## セットアップ (Setup)

### インストール (Installation)

1.  リポジトリをクローン:

    ```bash
    git clone https://github.com/TkymHrt/wake-on-lan-app.git
    cd wake-on-lan-app
    ```

2.  フロントエンドの依存関係をインストール:

    ```bash
    cd frontend
    npm install
    ```

### 環境設定 (Configuration)

バックエンドの設定は、`backend/main.go` ファイルで行います。必要に応じて、ポート番号などを変更してください。

## 開発環境 (Development)

1. フロントエンド開発サーバーを起動:
   ```bash
   cd frontend
   npm run dev
   ```

2. バックエンドサーバーを起動:
   ```bash
   cd backend
   go run main.go
   ```

## 本番環境用ビルド (Production Build)

1. フロントエンドをビルド:
   ```bash
   cd frontend
   npm run build
   ```

2. バックエンドをビルド:
   ```bash
   cd backend
   go build
   ```

## 使い方 (Usage)

1. MACアドレスを入力（必須）
2. デバイス名を入力（任意）
3. IPアドレスを入力（任意）
4. 「起動する」ボタンをクリック

