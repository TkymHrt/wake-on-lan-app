# Wake on LAN App

Wake on LANをWebブラウザから実行できるシンプルなアプリケーションです。

<img src="https://github.com/user-attachments/assets/c27172a8-8417-4944-989f-70c708da8ddd" width="50%">

## 技術スタック / Tech Stack

### フロントエンド / Frontend
- React
- Vite

### バックエンド / Backend
- Go

## セットアップ / Setup

### 必要条件 / Prerequisites

- Node.js
- Go

### インストール / Installation

1. リポジトリをクローン / Clone the repository:
```bash
git clone https://github.com/TkymHrt/wake-on-lan-app.git
cd wake-on-lan-app
```

2. フロントエンドの依存関係をインストール / Install frontend dependencies:
```bash
cd frontend
npm install
```

### 開発環境での実行 / Running in Development

1. フロントエンド開発サーバーを起動 / Start frontend development server:
```bash
cd frontend
npm run dev
```

2. バックエンドサーバーを起動 / Start backend server:
```bash
cd backend
go run main.go
```

### 本番環境用ビルド / Production Build

1. フロントエンドをビルド / Build frontend:
```bash
cd frontend
npm run build
```

2. バックエンドをビルド / Build backend:
```bash
cd backend
go run main.go
```

## 使用方法 / Usage

1. MACアドレスを入力（必須）/ Enter MAC address (required)
2. デバイス名を入力（任意）/ Enter device name (optional)
3. IPアドレスを入力（任意）/ Enter IP address (optional)
4. 「起動する」ボタンをクリック / Click "Wake" button
