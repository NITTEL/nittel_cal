---
mermaid: true
---

## 面談予約システム詳細フロー

<pre class="mermaid">
graph TD
    A{すぐ or 後日}:::decision
    A -->|すぐ| B[Meet URL発行]:::notification
    A -->|後日| C[オンライン枠確認]:::info

    C{対面 or オンライン}:::decision    
    C -->|対面| D[対面枠確認]:::info
    C -->|オンライン| E[オンライン枠確認]:::info
    
    D --> F[時間選択]:::process
    E --> F
    
    F --> G[予約者情報入力]:::input
    G --> H[Google Calendar登録]:::external
    H --> I[確認メール送信]:::notification
    I --> J[予約完了]:::success
    
    classDef start fill:#e3f2fd,stroke:#1976d2,stroke-width:3px,color:#000;
    classDef process fill:#f3e5f5,stroke:#7b1fa2,stroke-width:3px,color:#000;
    classDef decision fill:#fff3e0,stroke:#f57c00,stroke-width:3px,color:#000,font-size:12px;
    classDef info fill:#e8f5e8,stroke:#388e3c,stroke-width:3px,color:#000;
    classDef input fill:#e1f5fe,stroke:#0277bd,stroke-width:3px,color:#000;
    classDef external fill:#fff3e0,stroke:#f57c00,stroke-width:3px,color:#000;
    classDef notification fill:#fce4ec,stroke:#c2185b,stroke-width:3px,color:#000;
    classDef success fill:#c8e6c9,stroke:#388e3c,stroke-width:3px,color:#000;
    
    linkStyle default stroke:#333,stroke-width:3px
</pre> 