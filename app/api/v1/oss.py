import alibabacloud_oss_v2 as oss
from fastapi import APIRouter
from datetime import timedelta
import os

router = APIRouter()

# 環境変数から認証情報を読み込み、認証に使用する
credentials_provider = oss.credentials.EnvironmentVariableCredentialsProvider()

# SDK のデフォルト設定を読み込み、認証プロバイダを設定する
cfg = oss.config.load_default()
cfg.credentials_provider = credentials_provider

# 方法 1: Region のみを指定する（推奨）
# Region ID の指定が必須で、SDK は Region に基づいて HTTPS アクセスドメインを自動構築する
cfg.region = 'cn-beijing'

# 設定済みの情報を使って OSS クライアントを作成する
client = oss.Client(cfg)

# OSS ドメイン設定
OSS_ENDPOINT = os.getenv("OSS_ENDPOINT", "oss-cn-beijing.aliyuncs.com")
OSS_BUCKET = os.getenv("OSS_BUCKET")


@router.get("/oss/presign")
def chat_endpoint(filename: str):
    # ファイル拡張子から Content-Type を判定する
    content_type_map = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp",
    }
    ext = filename.split(".")[-1].lower() if "." in filename else "jpg"
    content_type = content_type_map.get(ext, "application/octet-stream")

    pre_result = client.presign(oss.PutObjectRequest(
        bucket=OSS_BUCKET,
        key=filename,
        content_type=content_type,
    ), expires=timedelta(seconds=3600))

    # アップロード URL とアクセス可能な画像パスを返す
    return {
        "uploadUrl": pre_result.url.strip('"'),
        "contentType": content_type,
        "accessUrl": f"https://{OSS_BUCKET}.{OSS_ENDPOINT}/{filename}"
    }
