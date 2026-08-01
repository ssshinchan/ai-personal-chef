/**
 * API 呼び出しのラッパー
 */
const API_BASE = "http://localhost:8001";

/**
 * OSS の事前署名アップロード URL を取得する
 */
export async function getOssPresignUrl(filename: string): Promise<{ uploadUrl: string; accessUrl: string; contentType: string }> {
    const response = await fetch(`${API_BASE}/api/v1/oss/presign?filename=${filename}`);
    if (!response.ok) {
        throw new Error("アップロード URL の取得に失敗しました");
    }
    const data = await response.json();
    return {
        uploadUrl: data.uploadUrl.trim().replace(/^["']|["']$/g, ''),
        accessUrl: data.accessUrl.trim().replace(/^["']|["']$/g, ''),
        contentType: data.contentType
    };
}

/**
 * 画像を OSS にアップロードする
 */
export async function uploadImageToOss(file: File): Promise<string> {
    // ファイル名を生成する
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${Date.now()}.${ext}`;

    // 事前署名 URL を取得する
    const { uploadUrl, accessUrl, contentType } = await getOssPresignUrl(filename);

    // 画像をアップロードする
    const response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
            "Content-Type": contentType,
        },
    });

    if (!response.ok) {
        throw new Error(`画像のアップロードに失敗しました: ${response.status}`);
    }

    // アクセス可能な画像パスを返す
    return accessUrl;
}

/**
 * ストリーミング会話
 */
export async function streamChat(
    message: string,
    onChunk: (chunk: string) => void,
    image_url?: string,
    onError?: (error: Error) => void,
    onComplete?: () => void,
    threadId?: string
): Promise<void> {
    try {
        const url = new URL(`${API_BASE}/api/v1/chat/stream`);

        const response = await fetch(url.toString(), {
            method: "POST",
            body: JSON.stringify({
                message,
                image_url: image_url,
                thread_id: threadId,
            }),
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("リクエストに失敗しました");
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error("レスポンスストリームを読み取れません");
        }

        const decoder = new TextDecoder();

        while (true) {
            const {done, value} = await reader.read();
            if (done) {
                onComplete?.();
                break;
            }

            const chunk = decoder.decode(value, {stream: true});
            onChunk(chunk);
        }
    } catch (error) {
        onError?.(error as Error);
    }
}

/**
 * 会話履歴を取得する
 */
export async function getChatHistory(threadId: string): Promise<{ role: string; content: string }[]> {
    const response = await fetch(`${API_BASE}/api/v1/chat/messages?thread_id=${threadId}`);
    if (!response.ok) {
        throw new Error("履歴メッセージの取得に失敗しました");
    }
    const data = await response.json();
    return data.messages;
}

/**
 * 会話履歴をクリアする
 */
export async function clearChatHistory(threadId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/v1/chat/messages?thread_id=${threadId}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error("履歴メッセージのクリアに失敗しました");
    }
}