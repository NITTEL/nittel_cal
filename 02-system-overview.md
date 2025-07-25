---
marp: true
theme: default 
paginate: true
mermaid: true
---

## システム全体フロー

<pre class="mermaid">
graph LR
    subgraph "初期対応"
        A[来店]:::start
        B[QRコードorタブレット]:::process
    end
    
    subgraph "予約システム"
        C[チャットボット]:::important
        D[入力情報送信]:::system
        E[面談予約システム]:::important
    end

    subgraph "オンライン接客"
        F[Google Meet]:::external
        G[完了]:::success
    end
    
    A --> B --> C --> D --> E --> F　--> G
    C --> H[対面接客（SIMやWIFI渡し）]:::process
    
    classDef start fill:#e3f2fd,stroke:#1976d2,stroke-width:3px,color:#000;
    classDef process fill:#f3e5f5,stroke:#7b1fa2,stroke-width:3px,color:#000
    classDef important fill:#ffcdd2,stroke:#d32f2f,stroke-width:3px,color:#000
    classDef system fill:#e8f5e8,stroke:#388e3c,stroke-width:3px,color:#000
    classDef external fill:#fff3e0,stroke:#f57c00,stroke-width:3px,color:#000
    classDef success fill:#c8e6c9,stroke:#388e3c,stroke-width:3px,color:#000
    
    linkStyle default stroke:#333,stroke-width:4px
</pre> 