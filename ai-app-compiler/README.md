# ⚡ AI App Compiler

> A compiler-like system that converts natural language into validated, executable application configurations.

**Natural Language → Intent → Blueprint → Schemas → Validated Config → Live App Preview**

---

## 🏗️ Architecture

```
User Prompt (NL)
       │
       ▼
┌──────────────────────────────────────────────────────┐
│              5-STAGE PIPELINE ORCHESTRATOR             │
│                                                        │
│  Stage 1       Stage 2       Stage 3                  │
│  Intent    →   System    →   Schema                   │
│  Extraction    Design        Generation               │
│  (Lexer)       (AST)         (Code Gen)               │
│                                                        │
│  Stage 4       Stage 5                                │
│  Refinement →  Validation                             │
│  (Optimizer)   + Repair                               │
│                (Linter)                               │
└──────────────────────────────────────────────────────┘
       │
       ▼
AppConfig JSON (validated)
       │
       ▼
React Runtime Renderer (live preview)
```

---

## 🚀 Quick Start

### 1. Start the Backend
```bash
cd backend
npm install
npm run dev
# Backend runs on http://localhost:3001
```

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

### 3. Open your browser
Navigate to `http://localhost:5173`

---

## 📦 Project Structure

```
ai-app-compiler/
├── backend/
│   └── src/
│       ├── pipeline/
│       │   ├── orchestrator.js      # Runs all 5 stages, SSE streaming
│       │   ├── stage1_intent.js     # NL → IntentSpec
│       │   ├── stage2_design.js     # IntentSpec → AppBlueprint
│       │   ├── stage3_schema.js     # Blueprint → UI/API/DB/Auth schemas
│       │   ├── stage4_refine.js     # Cross-layer consistency repair
│       │   └── stage5_validate.js   # Zod-like validation + repair engine
│       ├── schemas/
│       │   └── appConfigSchema.js   # Contract + validation + repair logic
│       ├── evaluation/
│       │   ├── dataset.js           # 20-prompt evaluation dataset
│       │   └── evaluator.js         # Metrics tracking engine
│       └── server.js                # Express + SSE endpoints
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── HomePage.jsx          # Main compiler UI
        │   └── EvalPage.jsx          # Evaluation dashboard
        └── components/
            ├── PipelineVisualizer    # Live stage progress
            ├── SchemaViewer          # JSON output tabs
            ├── AppRenderer           # Runtime app preview
            └── ValidationReport      # Error/repair display
```

---

## 🧩 Pipeline Stages

| Stage | Name | Role | Output |
|-------|------|------|--------|
| 1 | Intent Extraction | Lexer/Parser | IntentSpec JSON |
| 2 | System Design | AST Generation | AppBlueprint JSON |
| 3 | Schema Generation | Code Generation | UI+API+DB+Auth JSON |
| 4 | Refinement Layer | Optimizer/Linker | Cross-validated schemas |
| 5 | Validation + Repair | Linter | Final AppConfig + ValidationReport |

---

## 🛡️ Validation + Repair Engine

The repair engine uses **surgical repair** (not blind retry):
1. Validate the full AppConfig against the schema contract
2. If errors found → identify exact broken path (e.g., `api.endpoints[2].requestSchema`)
3. Auto-repair specific fields (not full regeneration)
4. Re-validate (max 3 attempts)
5. Report all repairs made

---

## 📊 AppConfig Schema Contract

```json
{
  "metadata": { "appName", "appType", "version", "generatedAt" },
  "ui": { "pages", "navigation", "theme" },
  "api": { "endpoints", "middleware" },
  "db": { "tables", "relations" },
  "auth": { "roles", "permissionsMatrix", "strategy" },
  "businessLogic": { "assumptions", "featureFlags", "premiumGating" },
  "validation": { "isValid", "errors", "warnings", "repairAttempts" }
}
```

---

## 📊 Evaluation Framework

- **20 test prompts**: 10 real products + 10 edge cases (vague, conflicting, incomplete)
- **Metrics tracked**: success rate, latency, repair attempts, failure types, entity/endpoint counts
- **Category analysis**: performance breakdown by prompt type

---

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/generate` | Stream pipeline (SSE) |
| GET | `/api/evaluation/dataset` | Get 20-prompt dataset |
| POST | `/api/evaluate` | Run full evaluation (SSE) |

---

## 💰 Cost vs Quality Tradeoffs

| Mode | Engine | Latency | Cost | Quality |
|------|--------|---------|------|---------|
| Fast | Mock (deterministic) | ~3-4s | $0 | Structured |
| Quality | Gemini Flash | ~8-10s | ~$0.0002/req | High |
| Premium | Gemini Pro | ~15-20s | ~$0.002/req | Excellent |

> Add `GEMINI_API_KEY=your_key` to `backend/.env` to enable AI-powered generation.
