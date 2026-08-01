import os

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.messages import HumanMessage
from langchain_core.messages import AIMessageChunk, AIMessage
from langchain_openai import ChatOpenAI
from langchain_tavily import TavilySearch
from langgraph.checkpoint.memory import InMemorySaver

from app.common.logger import logger

load_dotenv()

# Web 検索ツール。Tavily を Web 検索ツールとして使用する
web_search = TavilySearch(
    max_results=5,
    topic="general",
)
system_prompt = """
あなたは専属シェフです。ユーザーから食材の写真または一覧を受け取ったら、次の手順で対応してください。
1. 食材の識別と評価: ユーザーが写真を提供した場合は、まず写っている食材をすべて見分けます。食材の見た目の状態をもとに、新鮮さと使える量を評価し、「現在使える食材一覧」として整理してください。
2. レシピのスマート検索: まず web_search ツールを優先して呼び出し、「使える食材一覧」を中心キーワードとして、実行可能なレシピを探してください。
3. 多面的な評価と順位付け: 検索した候補レシピを、栄養価と調理難易度の 2 つの観点から数値化して採点し、得点順に並べます。簡単で栄養豊富なものを上位にしてください。
4. 構造化された提案の出力: 並べ替えたレシピを、見やすい提案レポートとしてまとめます。レシピ情報、得点、おすすめ理由、参考画像を含め、ユーザーがすばやく判断できるようにしてください。

必ずこの手順に従い、まず web_search ツールでレシピを検索してください。見つからない場合のみ、自分なりに工夫して構いません。
"""
# OpenAI 互換 API の Chat モデルを初期化
chat_model = ChatOpenAI(
    model=os.getenv("OPENAI_MODEL"),
    base_url=os.getenv("OPENAI_BASE_URL"),
)
# checkpointer を初期化（現在の環境ではメモリ保存を使用）
checkpointer = InMemorySaver()

agent = create_agent(
    model=chat_model,
    tools=[web_search],
    system_prompt=system_prompt,
    checkpointer=checkpointer,
)


async def search_recipes(prompt: str, image: str, thread_id: str):
    """agent を呼び出してレシピを検索する"""
    logger.info(f"[ユーザー]: {prompt}, image: {image}, thread_id: {thread_id}")
    try:
        # 画像の有無を判定し、異なる形式のメッセージを組み立てる
        if not image or image.strip() == "":
            message = HumanMessage(content=prompt)
        else:
            message = HumanMessage(content=[
                {"type": "image", "url": image},
                {"type": "text", "text": prompt}
            ])

        # Agent をストリーミング呼び出し
        for chunk, metadata in agent.stream(
                {"messages": [message]},
                {"configurable": {"thread_id": thread_id}},
                stream_mode="messages"
        ):
            if isinstance(chunk, AIMessageChunk) and chunk.content:
                yield chunk.content
    except Exception as e:
        logger.error(f"\n[エラー]: {str(e)}")
        yield "情報検索に失敗しました。食材リストを手入力してみますか？"


# 会話をクリア
def clear_messages(thread_id: str):
    """会話をクリアする"""
    logger.info(f"履歴メッセージをクリアします、thread_id: {thread_id}")
    checkpointer.delete_thread(thread_id)


# 会話履歴を取得
def get_messages(thread_id: str) -> list[dict[str, str]]:
    """会話履歴を取得する"""
    logger.info(f"履歴メッセージを取得します、thread_id: {thread_id}")

    # thread_id に基づいて checkpoint を取得する
    checkpoint = checkpointer.get({"configurable": {"thread_id": thread_id}})

    # 存在しない場合は空リストを返す
    if not checkpoint:
        return []

    # messages を安全に取得する
    channel_values = checkpoint.get("channel_values")
    if not channel_values:
        return []

    messages = channel_values.get("messages", [])
    if not messages:
        return []

    # メッセージ形式を変換する
    result = []
    for msg in messages:
        if not msg.content:
            continue

        if isinstance(msg, HumanMessage):
            result.append({"role": "user", "content": msg.content})
        elif isinstance(msg, AIMessage):
            result.append({"role": "assistant", "content": msg.content})

    return result
