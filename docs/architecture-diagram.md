# LiveData OS - System Architecture Diagram

## Visual Architecture (Mermaid Diagram)

Copy this code to any Mermaid renderer (GitHub, Mermaid Live Editor, etc.)

```mermaid
graph TB
    subgraph "User Browser"
        UI[React Frontend]
        NodePanel[Node Panel<br/>Drag & Drop]
        Canvas[React Flow Canvas<br/>Visual Editor]
        ConfigPanel[Config Panel<br/>Smart Fields]
        Viz[Charts & Tables<br/>Visualization]

        UI --> NodePanel
        UI --> Canvas
        UI --> ConfigPanel
        UI --> Viz

        Store[Zustand State<br/>Flow Store + App Store]
        Canvas --> Store
        Store --> Canvas
    end

    subgraph "Plugin System"
        P1[Data Source<br/>CSV/Samples]
        P2[Data Processing<br/>Clean/Filter/Transform]
        P3[Financial Analysis<br/>Returns/Drawdown/Sharpe]
        P4[AI Processor<br/>Natural Language]
        P5[Visualization<br/>Charts/Tables]

        Canvas --> P1
        Canvas --> P2
        Canvas --> P3
        Canvas --> P4
        Canvas --> P5
    end

    subgraph "Backend Server"
        API[REST API Endpoints]
        Session[Session Management]
        DataProc[Data Processing]
        AIService[AI Service Layer]

        API --> Session
        API --> DataProc
        API --> AIService
    end

    subgraph "Google Cloud Platform"
        Gemini[Gemini API<br/>AI Model]
        GCP[Google Cloud Services]

        Gemini --> GCP
    end

    UI -->|HTTP/REST| API
    P4 -->|AI Request| API
    AIService -->|API Call| Gemini

    style UI fill:#61dafb
    style Canvas fill:#61dafb
    style Store fill:#ffa500
    style P4 fill:#4285f4
    style Gemini fill:#4285f4
    style GCP fill:#4285f4
```

## Detailed Component Interaction

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Canvas
    participant Plugin
    participant Backend
    participant Gemini

    User->>Frontend: Drag Data Source Node
    Frontend->>Canvas: Add Node to Canvas
    Canvas->>Plugin: Initialize Data Source

    User->>Frontend: Drag AI Processor Node
    Frontend->>Canvas: Add AI Node

    User->>Canvas: Connect Nodes
    Canvas->>Canvas: Validate (No Cycles)

    User->>Canvas: Double-click AI Node
    Canvas->>Plugin: Execute Upstream Nodes
    Plugin->>Plugin: Load Data

    Canvas->>Plugin: Execute AI Node
    Plugin->>Backend: POST /api/ai/analyze
    Backend->>Gemini: Call Gemini API
    Gemini-->>Backend: AI Analysis Result
    Backend-->>Plugin: Return Insights
    Plugin-->>Canvas: Update Node State
    Canvas-->>Frontend: Display Results
    Frontend-->>User: Show AI Insights
```

## Data Flow Architecture

```mermaid
flowchart LR
    A[User Input] --> B{Node Type}

    B -->|Data Source| C[Load CSV/Sample]
    B -->|Processing| D[Transform Data]
    B -->|AI| E[Natural Language]
    B -->|Visualization| F[Render Chart]

    C --> G[Node Output]
    D --> G
    E --> H[Backend API]
    H --> I[Google Gemini]
    I --> G

    G --> J[Next Node Input]
    J --> B

    G --> F
    F --> K[Display to User]
```

## Technology Stack Diagram

```mermaid
graph LR
    subgraph "Frontend Stack"
        React[React 18]
        TS[TypeScript]
        RF[React Flow]
        Zustand[Zustand]
        TW[Tailwind CSS]
        Vite[Vite]
    end

    subgraph "Backend Stack"
        Node[Node.js]
        Express[Express]
        Axios[Axios]
    end

    subgraph "Google Cloud"
        GeminiAPI[Gemini API]
        Auth[API Key Auth]
    end

    React --> RF
    React --> Zustand
    React --> TW
    TS --> React
    Vite --> React

    React -->|HTTP| Express
    Express --> Node
    Express -->|API Call| GeminiAPI
    Auth --> GeminiAPI
```

## Plugin Architecture

```mermaid
classDiagram
    class IAnalysisPlugin {
        +string id
        +string name
        +string type
        +execute(input, config) Promise
        +configSchema Object
    }

    class DataSourcePlugin {
        +id: "dataSource"
        +execute() LoadData
    }

    class AIProcessorPlugin {
        +id: "aiProcessor"
        +execute() CallGemini
    }

    class ChartPlugin {
        +id: "chart"
        +execute() RenderChart
    }

    class FilterPlugin {
        +id: "filter"
        +execute() FilterData
    }

    IAnalysisPlugin <|-- DataSourcePlugin
    IAnalysisPlugin <|-- AIProcessorPlugin
    IAnalysisPlugin <|-- ChartPlugin
    IAnalysisPlugin <|-- FilterPlugin
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        Dev[Local Development<br/>npm run dev]
    end

    subgraph "Production Deployment"
        Build[Vite Build<br/>Static Assets]
        CDN[CDN/Static Hosting]
        Server[Backend Server<br/>Node.js]
    end

    subgraph "Google Cloud"
        GCP[Gemini API<br/>AI Processing]
    end

    Dev -->|Build| Build
    Build --> CDN
    Build --> Server
    Server -->|API Calls| GCP

    User[End Users] -->|HTTPS| CDN
    User -->|API Requests| Server
```

---

**Note**: These diagrams can be rendered on:
- GitHub (native Mermaid support)
- [Mermaid Live Editor](https://mermaid.live)
- VS Code with Mermaid extension
- Documentation sites (GitBook, Docusaurus, etc.)
