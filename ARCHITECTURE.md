# LiveData OS Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    React Frontend                          │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│  │  │   Node      │  │   Config     │  │   Chart/Table   │  │  │
│  │  │   Panel     │  │   Panel      │  │   Visualization │  │  │
│  │  └─────────────┘  └──────────────┘  └─────────────────┘  │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │         React Flow Canvas (Node Editor)              │ │  │
│  │  │  ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐      │ │  │
│  │  │  │ Data │───▶│Filter│───▶│ AI   │───▶│Chart │      │ │  │
│  │  │  │Source│    │      │    │Proc. │    │      │      │ │  │
│  │  │  └──────┘    └──────┘    └──────┘    └──────┘      │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │         Zustand State Management                      │ │  │
│  │  │  • Flow Store (nodes, edges, execution state)        │ │  │
│  │  │  • App Store (UI state, selections)                  │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └────────────────────────┬──────────────────────────────────┘  │
└────────────────────────────┼─────────────────────────────────────┘
                             │ HTTP/REST API
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend Server (Node.js)                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    API Endpoints                           │  │
│  │  • /api/session - Create session                          │  │
│  │  • /api/upload/:sessionId - Upload CSV                    │  │
│  │  • /api/load-sample/:sessionId/:scenario - Load samples   │  │
│  │  • /api/schema/:sessionId - Get data schema               │  │
│  │  • /api/ai/analyze - AI analysis endpoint                 │  │
│  └────────────────────────┬──────────────────────────────────┘  │
│                           │                                      │
│  ┌────────────────────────▼──────────────────────────────────┐  │
│  │              Data Processing Layer                        │  │
│  │  • CSV Parser                                             │  │
│  │  • Data Validation                                        │  │
│  │  • Session Management                                     │  │
│  └────────────────────────┬──────────────────────────────────┘  │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                             │ Google Cloud API
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Google Cloud Platform                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  Gemini API (AI Model)                     │  │
│  │  • Natural language understanding                          │  │
│  │  • Data analysis suggestions                              │  │
│  │  • Intelligent insights generation                        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Flow

### 1. User Interaction Flow
```
User → Drag Node → Canvas → Update Zustand Store → Render Node
User → Connect Nodes → Validate Connection → Update Edges → Store
User → Execute Node → Trigger Plugin → Process Data → Update Node State
```

### 2. Data Processing Flow
```
Data Source Node → Execute
    ↓
Load CSV/Sample Data
    ↓
Pass to Connected Node
    ↓
Processing Plugin (Filter/Clean/Transform)
    ↓
Output to Next Node
    ↓
Visualization Node (Chart/Table)
```

### 3. AI Analysis Flow
```
User Input (Natural Language) → AI Processor Node
    ↓
Send to Backend API (/api/ai/analyze)
    ↓
Backend calls Google Gemini API
    ↓
Gemini processes request with data context
    ↓
Return analysis/suggestions
    ↓
Display in Node + Config Panel
```

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **React Flow** - Node editor canvas
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime
- **Express** (assumed) - Web framework
- **Google Gemini API** - AI processing

### Google Cloud Integration
- **Gemini API** - Powers AI analysis features
- **API Key Authentication** - Secure access to Google services

## Plugin Architecture

Each analysis node is a self-contained plugin:

```typescript
interface IAnalysisPlugin {
  id: string;              // Unique identifier
  name: string;            // Display name
  type: string;            // Node type
  execute: Function;       // Processing logic
  configSchema: Object;    // Configuration fields
}
```

Plugins are registered in `plugins/registry.ts` and dynamically loaded.

## Data Flow Architecture

1. **Input Layer**: Data sources (CSV upload, built-in datasets)
2. **Processing Layer**: 14 plugins for transformation and analysis
3. **AI Layer**: Google Gemini integration for intelligent insights
4. **Output Layer**: Visualizations (charts, tables)

## State Management

### Flow Store
- Nodes array (id, type, position, data)
- Edges array (source, target, connection info)
- Execution state (running, success, error)
- Node output cache

### App Store
- Selected node ID
- UI state (panels visibility)
- Configuration values

## Security Considerations

- API keys stored in environment variables
- Backend validates all data inputs
- Frontend sanitizes user inputs
- CORS configured for API access
