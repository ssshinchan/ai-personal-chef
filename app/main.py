import os

from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import chat
from app.api.v1 import oss
from app.common.logger import setup_logging


# ログ設定を初期化
setup_logging()

app = FastAPI(
    title="Personal Chief API",
    description="パーソナルシェフ",
    version="0.1.0"
)

# 1. クロスオリジン資源共有 (CORS) を設定
# プラグイン開発では、リクエストがブラウザ拡張環境から来るため、CORS を正しく設定する必要があります
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では、拡張機能の ID か具体的なドメインを指定することを推奨します
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. ルーターを登録
app.include_router(chat.router, prefix="/api/v1", tags=["会話"])
app.include_router(oss.router, prefix="/api/v1", tags=["アップロード署名 URL 取得"])

# 3. フロントエンド資産をマウント
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

# フロントエンドのフォールバックルート - API リクエストのみを除外
@app.get("/{path:path}", include_in_schema=False)
async def serve_frontend(path: str):
    # API パスを除外
    if path.startswith("api/"):
        from fastapi.responses import JSONResponse
        return JSONResponse({"error": "Not Found"}, status_code=404)
    # リクエストが静的ファイルなら、そのまま返す
    file_path = os.path.join(static_dir, path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    # それ以外は index.html を返す（SPA のフォールバック）
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "あなた専用のシェフが起動しました〜", "status": "ok"}

if __name__ == "__main__":
    import uvicorn
    # 起動コマンド: python -m app.main
    uvicorn.run("app.main:app", host="127.0.0.1", port=8001, reload=True)
