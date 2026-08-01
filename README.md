# AIレシピ推薦アプリ (AI Recipe Recommender)

アップロードされた食べ物の画像に基づいて、AIがレシピを提案するフルスタックアプリケーションです。

## 概要

このプロジェクトは、ユーザーがアップロードした食材や料理の画像から、AI（OpenAIモデル）を活用して最適なレシピを提案するシステムです。LangChainとLangGraphを使用してAIエージェントを構築し、Tavilyによるウェブ検索を組み合わせています。

## アーキテクチャとディレクトリ構成

### バックエンド (Python / FastAPI)
- **`app/main.py`**: FastAPIアプリケーションのエントリーポイント。CORSの設定、APIルーターのマウント、フロントエンドの静的ファイルの配信を行います。
- **`app/api/v1/`**: APIルートの定義。
  - `chat.py`: チャットストリーミングエンドポイント（`/api/v1/chat/stream`）とメッセージ履歴の管理。
  - `oss.py`: Alibaba Cloud OSSへの画像アップロード用署名付きURLの生成（`/api/v1/oss/presign`）。
- **`app/agent/personal_chef_agent.py`**: LangChainとLangGraphを使用したコアAIロジック。テキストプロンプトや画像URLに基づいてレシピを提案するエージェントを定義しています。
- **`app/models/schemas.py`**: リクエスト/レスポンス検証用のPydanticモデル。
- **`app/common/logger.py`**: ログ設定。

### フロントエンド (Next.js / React)
- **`frontend/app/`**: Next.js App Routerのメインページとレイアウト。
- **`frontend/components/`**: 再利用可能なReactコンポーネント（`ChatInput.tsx`、`ChatMessage.tsx`、`RecipeCard.tsx`など）。
- **`frontend/lib/`**: ユーティリティ関数とAPIクライアントコード。
- **`frontend/types/`**: TypeScriptの型定義。

## 主な技術スタック

- **バックエンド**: Python, FastAPI, LangChain, LangGraph, OpenAI API, Tavily Search, Alibaba Cloud OSS
- **フロントエンド**: Next.js (App Router), React, Tailwind CSS, TypeScript

## セットアップと実行方法

### バックエンドのセットアップ

1. 依存関係のインストール:
   ```bash
   uv sync
   # または pip を使用する場合: pip install -r requirements.txt
   ```

2. サーバーの起動:
   ```bash
   python -m app.main
   # または
   uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
   ```

### フロントエンドのセットアップ

1. ディレクトリの移動と依存関係のインストール:
   ```bash
   cd frontend
   npm install
   ```

2. 開発サーバーの起動:
   ```bash
   npm run dev
   ```

3. ビルドとリント:
   ```bash
   npm run build
   npm run lint
   ```