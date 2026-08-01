/**
 * チャット関連の型定義
 */

export type MessageRole = "user" | "assistant" | "system";

// マルチモーダルメッセージの内容項目
export type MessageContentPart =
    | { type: "text"; text: string }
    | { type: "image"; url: string };

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  contentParts?: MessageContentPart[]; // マルチモーダル内容
  imageUrl?: string; // 旧版互換
  timestamp: number;
  loading?: boolean;
  streaming?: boolean; // ストリーミング出力中かどうか
}

export interface Recipe {
  title: string;
  score?: number;
  reason?: string;
  difficulty?: string;
  url?: string;
  steps?: string[];
  seasonings?: string[];
  cooking_time?: string;
}