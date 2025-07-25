---
theme: default
paginate: false
mermaid: true
---

## チャットボット詳細フロー（プロンプト準拠）

<pre class="mermaid">
graph TD

A[チャットボット開始]:::start
A --> B{1-予約していますか？}:::decision
B -->|はい| C[予約者名を入力]:::info --> D[スタッフへ接続]:::important
B -->|いいえ| E{2-ご契約者様ですか？}:::decision
E -->|はい| F[契約者名義を入力]:::info --> G[3-サービスを選択]:::process
E -->|いいえ| H[お名前を入力]:::info --> G
G --> I[4-カテゴリを選択]:::process --> K[予約リンク送信]:::important

classDef start fill:#e3f2fd,stroke:#1976d2,stroke-width:3px,color:#000;
classDef process fill:#f3e5f5,stroke:#7b1fa2,stroke-width:3px,color:#000;
classDef decision fill:#fef3e0,stroke:#f57c00,stroke-width:3px,color:#000,font-size:12px;
classDef info fill:#e8f5e9,stroke:#388e3c,stroke-width:3px,color:#000;
classDef important fill:#ffccdd,stroke:#d32f2f,stroke-width:3px,color:#000;
linkStyle default stroke:#333,stroke-width:2.5px;
</pre>