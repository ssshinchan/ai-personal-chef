"use client";

import {useState, useEffect, useRef} from "react";
import {Message} from "@/types/chat";
import {ChatMessage} from "@/components/ChatMessage";
import {ChatInput} from "@/components/ChatInput";
import {uploadImageToOss, streamChat, getChatHistory, clearChatHistory} from "@/lib/api";
import {generateUUID} from "@/lib/utils";
import {UtensilsCrossed, ChefHat, Plus} from "lucide-react";

export default function Home() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [processing, setProcessing] = useState(false);
    const [threadId, setThreadId] = useState<string>("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageIdCounter = useRef(0);

    // 履歴メッセージを読み込む
    const loadHistory = async (id: string) => {
        try {
            const history = await getChatHistory(id);
            if (history && history.length > 0) {
                const loadedMessages: Message[] = history.map((msg, index) => {
                    // マルチモーダルメッセージを処理する
                    let content = "";
                    let imageUrl: string | undefined;

                    if (typeof msg.content === 'string') {
                        content = msg.content;
                    } else if (Array.isArray(msg.content)) {
                        // テキストと画像を抽出する
                        const parts = msg.content as { type: string; text?: string; url?: string }[];
                        for (const part of parts) {
                            if (part.type === 'text' && part.text) {
                                content += part.text;
                            } else if (part.type === 'image' && part.url) {
                                imageUrl = part.url;
                            }
                        }
                    }

                    return {
                        id: `history_${index}_${Date.now()}`,
                        role: msg.role as "user" | "assistant",
                        content,
                        imageUrl,
                        timestamp: Date.now() - (history.length - index) * 1000,
                    };
                });
                setMessages(loadedMessages);
                messageIdCounter.current = loadedMessages.length;
            }
        } catch (error) {
            console.error("履歴メッセージの読み込みに失敗しました:", error);
        }
    };

    // ページ読み込み時に localStorage から thread_id を取得または生成して履歴を読み込む
    useEffect(() => {
        // localStorage から thread_id を取得し、なければ新規生成する
        let storedThreadId = localStorage.getItem("thread_id");
        if (!storedThreadId) {
            storedThreadId = generateUUID();
            localStorage.setItem("thread_id", storedThreadId);
        }
        setThreadId(storedThreadId);
        loadHistory(storedThreadId);
    }, []);

    // 新しい会話を開始する
    const handleNewChat = async () => {
        // 現在の会話履歴をクリアする
        if (threadId) {
            try {
                await clearChatHistory(threadId);
            } catch (error) {
                console.error("履歴のクリアに失敗しました:", error);
            }
        }
        // 新しい thread_id を生成して localStorage に保存する
        const newThreadId = generateUUID();
        localStorage.setItem("thread_id", newThreadId);
        setThreadId(newThreadId);
        // メッセージをクリアする
        setMessages([]);
        messageIdCounter.current = 0;
    };

    // 最下部までスクロールする
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [messages]);

    // メッセージを追加する
    const addMessage = (message: Omit<Message, "id" | "timestamp">) => {
        messageIdCounter.current += 1;
        const newMessage: Message = {
            ...message,
            id: `msg_${messageIdCounter.current}_${Date.now()}`,
            timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, newMessage]);
        return newMessage;
    };

    // 送信処理
    const handleSend = async (text: string, file?: File) => {
        if (processing) return;

        let imageUrl: string | undefined;

        // 画像がある場合は先に OSS へアップロードする
        if (file) {
            try {
                imageUrl = await uploadImageToOss(file);
            } catch (error) {
                console.error("画像のアップロードに失敗しました:", error);
                addMessage({
                    role: "assistant",
                    content: "画像のアップロードに失敗しました。しばらくしてから再試行してください。",
                });
                return;
            }
        }

        // ユーザーメッセージを追加する
        addMessage({
            role: "user",
            content: text || "食材画像をアップロードしました",
            imageUrl,
        });

        setProcessing(true);

        // アシスタントメッセージを追加する（ストリーミング出力）
        const assistantMessageId = addMessage({
            role: "assistant",
            content: "",
            streaming: true,
        }).id;

        try {
            await streamChat(
                text || "これは冷蔵庫の中の食材です。何が作れるか見てください。",
                (chunk) => {
                    // メッセージ内容を更新する
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === assistantMessageId
                                ? {...msg, content: msg.content + chunk}
                                : msg
                        )
                    );
                }, imageUrl,
                (error) => {
                    console.error("会話に失敗しました:", error);
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === assistantMessageId
                                ? {
                                    ...msg,
                                    content: msg.content + `\n[エラー]: ${error.message}`,
                                    streaming: false,
                                }
                                : msg
                        )
                    );
                },
                () => {
                    // ストリーミング出力完了
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === assistantMessageId
                                ? {...msg, streaming: false}
                                : msg
                        )
                    );
                },
                threadId
            );
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-screen relative">
            {/* 背景 */}
            <div className="fixed inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50"/>
            <div className="fixed inset-0 opacity-30">
                <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse"/>
                <div className="absolute top-40 right-10 w-96 h-96 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '1s'}}/>
                <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-red-100 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '2s'}}/>
            </div>

            {/* 固定トップタイトルバー */}
            <header className="fixed top-0 left-0 right-0 z-50 p-4">
                <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                            <ChefHat className="text-white" size={24}/>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">AI パーソナルシェフ</h1>
                            <p className="text-sm text-gray-500">食材画像をアップロードして、パーソナライズされたレシピ提案を受け取る</p>
                        </div>
                    </div>
                    <button
                        onClick={handleNewChat}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors"
                    >
                        <Plus size={18}/>
                        <span>新しい会話</span>
                    </button>
                </div>
            </header>

            {/* メインコンテンツ領域 */}
            <div className="relative flex flex-col min-h-screen max-w-4xl mx-auto px-4 pt-24 pb-24">
                {/* チャット領域 */}
                <div className="flex-1 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 mt-3">
                                <div className="p-4 bg-white/80 rounded-full mb-4">
                                    <UtensilsCrossed size={48} className="text-orange-400"/>
                                </div>
                                <p className="text-lg font-medium text-gray-600">食材画像をアップロードして始めましょう</p>
                                <p className="text-sm mt-2 text-gray-400">食材を見分けてレシピを提案します</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((message) => (
                                    <ChatMessage key={message.id} message={message}/>
                                ))}
                                <div ref={messagesEndRef}/>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 固定ボトム入力領域 */}
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
                <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50">
                    <ChatInput onSend={handleSend} disabled={processing}/>
                </div>
            </div>
        </div>
    );
}