import os
import io
import json
import urllib.request
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import fitz

load_dotenv()

# Firebase Admin SDK
import firebase_admin
from firebase_admin import credentials, firestore

cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
if cred_path and os.path.exists(cred_path):
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Firebase Admin SDK initialized")
else:
    db = None
    print("Firebase Admin SDK not initialized (no credentials)")

app = FastAPI(title="TechBrief AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


def get_firestore_doc(collection_name: str, doc_id: str) -> dict | None:
    if db is None:
        return None
    try:
        doc_ref = db.collection(collection_name).document(doc_id)
        snapshot = doc_ref.get()
        if snapshot.exists:
            data = snapshot.to_dict()
            data["id"] = snapshot.id
            return data
    except Exception as e:
        print(f"Firestore read error: {e}")
    return None


def set_firestore_doc(collection_name: str, doc_id: str, data: dict):
    if db is None:
        return
    try:
        db.collection(collection_name).document(doc_id).set(data)
    except Exception as e:
        print(f"Firestore write error: {e}")


def extract_text_from_pdf(file_bytes: bytes) -> dict:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    full_text = ""
    sections = []
    current_section = {"title": "Introduction", "content": ""}
    page_count = len(doc)

    for page in doc:
        text = page.get_text()
        lines = text.split("\n")
        for line in lines:
            stripped = line.strip()
            if stripped and (stripped.isupper() or (len(stripped) < 100 and stripped.endswith(":"))):
                if current_section["content"]:
                    sections.append(current_section)
                current_section = {"title": stripped, "content": ""}
            else:
                current_section["content"] += line + " "
        full_text += text + " "

    if current_section["content"]:
        sections.append(current_section)

    return {"full_text": full_text.strip(), "sections": sections, "page_count": page_count}


def extract_text_from_docx(file_bytes: bytes) -> dict:
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        full_text = ""
        sections = []
        current_section = {"title": "Introduction", "content": ""}

        for para in doc.paragraphs:
            text = para.text.strip()
            if para.style.name.startswith("Heading") or (text and (text.isupper() or len(text) < 100)):
                if current_section["content"]:
                    sections.append(current_section)
                current_section = {"title": text, "content": ""}
            else:
                current_section["content"] += text + " "

        if current_section["content"]:
            sections.append(current_section)

        return {
            "full_text": full_text.strip() or " ".join(s["content"] for s in sections),
            "sections": sections,
            "page_count": 1,
        }
    except ImportError:
        return {
            "full_text": file_bytes.decode("utf-8", errors="replace"),
            "sections": [{"title": "Document", "content": file_bytes.decode("utf-8", errors="replace")}],
            "page_count": 1,
        }


SYSTEM_PROMPT = """You are an expert technical analyst AI. Analyze the following technical document comprehensively.

Document: {filename}
Word count: {wordCount}

Document text:
{rawText}

Provide a comprehensive structured analysis including:
1. Multi-level summaries (30-second, executive, detailed, bullet)
2. Key findings, action items, risks, recommendations
3. Important metrics (percentages, dates, accuracy, performance, costs)
4. Technical keywords and auto-glossary
5. Section-wise summaries
6. Timeline of milestones, phases, deadlines
7. Knowledge graph (nodes = key concepts/entities, edges = relationships between them)
8. Evaluation metrics (estimate ROUGE-1, ROUGE-2, ROUGE-L on 0-1 scale, BERTScore 0-1, compression_ratio as original_words/summary_words ratio, confidence 0-1)

Summary length preference: {summaryLength}
Creativity level: {creativity}
Language: {language}

Respond ONLY with valid JSON matching this structure:
{{
  "summary_30s": "string",
  "summary_executive": "string",
  "summary_detailed": "string",
  "summary_bullet": ["string"],
  "key_findings": ["string"],
  "action_items": ["string"],
  "risks": ["string"],
  "recommendations": ["string"],
  "metrics": [{{"label": "string", "value": "string", "category": "percentage|date|accuracy|performance|cost"}}],
  "keywords": ["string"],
  "glossary": [{{"term": "string", "definition": "string"}}],
  "section_summaries": [{{"title": "string", "summary": "string"}}],
  "timeline": [{{"event": "string", "date": "string", "type": "milestone|phase|deadline"}}],
  "knowledge_graph": {{"nodes": [{{"id": "string", "label": "string", "type": "concept|entity|metric|method|technology"}}], "edges": [{{"source": "string", "target": "string", "label": "string"}}]}},
  "evaluation": {{"rouge1": 0.0, "rouge2": 0.0, "rougeL": 0.0, "bertscore": 0.0, "compression_ratio": 0.0, "confidence": 0.0}}
}}"""

CHAT_PROMPT = """You are an AI assistant answering questions about a technical document. Use the document content below to answer accurately. Always cite the section or part of the document you're referencing.

Document: {filename}

Document text:
{docText}

Key findings from analysis:
{findings}

Technical keywords: {keywords}

Question: {question}

Answer the question based on the document. If the answer isn't in the document, say so. Include citations referencing specific sections like [Section: ...] or quote relevant passages."""

COMPARE_PROMPT = """Compare these two technical documents. Identify similarities, differences, and provide a comparative summary.

Document 1: {doc1Name}
{doc1Text}

Document 2: {doc2Name}
{doc2Text}

Provide:
- Similarities between the documents
- Key differences
- A comparative summary
- A comparison table with aspects, and how each document addresses them

Respond ONLY with valid JSON matching this structure:
{{
  "similarities": ["string"],
  "differences": ["string"],
  "comparative_summary": "string",
  "comparison_table": [{{"aspect": "string", "document1": "string", "document2": "string"}}]
}}"""


def call_gemini(prompt: str, temperature: float = 0.3, max_tokens: int = 8192) -> str:
    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
        return mock_ai_response(prompt)

    try:
        from google import genai

        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config={"temperature": temperature, "max_output_tokens": max_tokens},
        )
        return response.text
    except Exception as e:
        print(f"Gemini API error: {e}")
        return mock_ai_response(prompt)


def mock_ai_response(prompt: str) -> str:
    if "Compare these two technical documents" in prompt:
        return json.dumps({
            "similarities": [
                "Both documents discuss technical architecture",
                "Both propose scalable solutions",
                "Both include performance considerations",
            ],
            "differences": [
                "Doc 1 focuses on microservices while Doc 2 uses monolith",
                "Doc 1 uses Python, Doc 2 uses Java",
                "Doc 1 has higher cost estimates",
            ],
            "comparative_summary": "Both documents present valid architectural approaches with different trade-offs. Document 1 favors modularity while Document 2 prioritizes simplicity.",
            "comparison_table": [
                {"aspect": "Architecture", "document1": "Microservices-based", "document2": "Monolithic"},
                {"aspect": "Language", "document1": "Python", "document2": "Java"},
                {"aspect": "Scalability", "document1": "Horizontal scaling", "document2": "Vertical scaling"},
                {"aspect": "Deployment", "document1": "Containerized (Docker/K8s)", "document2": "Traditional server"},
            ],
        })

    if "Answer the question" in prompt:
        return (
            "Based on the document analysis, this technical report covers several key areas. "
            "[Section: Introduction] The main objective is to present a comprehensive solution architecture. "
            "[Section: Methodology] The approach uses agile development practices with continuous integration."
        )

    return json.dumps({
        "summary_30s": "This technical document presents a comprehensive analysis of a modern software architecture designed for scalability and performance. The system employs a microservices-based approach with event-driven communication. Key findings highlight significant improvements in throughput and reduced latency.",
        "summary_executive": "The document outlines a production-ready technical architecture that addresses critical challenges in distributed systems. Through careful analysis of system requirements, the proposed solution achieves 99.9% uptime while reducing operational costs by 35%. The architecture leverages containerization, orchestration, and observability best practices to deliver a robust platform capable of handling enterprise-scale workloads.",
        "summary_detailed": "This comprehensive technical report details the design and implementation of a modern distributed system architecture. The document begins with an introduction to the problem domain, followed by a thorough analysis of system requirements. The proposed architecture employs a microservices pattern with event-driven communication using message queues. Each service is independently deployable and scalable, with clear API contracts defined using OpenAPI specifications.\n\nPerformance analysis shows the system can handle 10,000 concurrent users with an average response time under 200ms. The caching strategy, using Redis for hot data and CDN for static assets, reduces database load by 60%. Security is addressed through OAuth 2.0 authentication, TLS encryption, and regular penetration testing.\n\nThe deployment strategy uses Kubernetes for orchestration, with automated CI/CD pipelines ensuring zero-downtime deployments. Monitoring and observability are achieved through Prometheus metrics, ELK stack logging, and distributed tracing with Jaeger.",
        "summary_bullet": [
            "Microservices architecture with event-driven communication and message queues",
            "99.9% uptime with horizontal scaling and automated failover mechanisms",
            "35% reduction in operational costs through containerization and orchestration",
            "10,000 concurrent user capacity with sub-200ms average response time",
            "Comprehensive security: OAuth 2.0, TLS encryption, and regular penetration testing",
            "Automated CI/CD pipeline with zero-downtime Kubernetes deployments",
            "Full observability stack: Prometheus, ELK, and Jaeger distributed tracing",
        ],
        "key_findings": [
            "Microservices architecture significantly improves system modularity and maintainability",
            "Event-driven communication reduces service coupling and improves fault isolation",
            "Containerization with Docker and Kubernetes enables consistent deployments across environments",
            "Redis caching layer reduces database query load by 60%",
            "Automated CI/CD pipeline reduces deployment time from hours to minutes",
            "Distributed tracing reveals 40% of latency is in inter-service communication",
            "The system achieves 99.9% uptime with proper failover configuration",
        ],
        "action_items": [
            "Set up Kubernetes cluster with at least 3 worker nodes for production deployment",
            "Implement OAuth 2.0 authorization server and configure all services",
            "Deploy Redis cluster for caching with replication and persistence",
            "Configure monitoring dashboards in Grafana for all services",
            "Set up automated CI/CD pipelines using GitHub Actions or GitLab CI",
            "Conduct load testing to validate 10,000 concurrent user capacity",
            "Implement distributed tracing with Jaeger agents in all services",
        ],
        "risks": [
            "Network latency in inter-service communication could impact performance at scale",
            "Learning curve for team adopting microservices and containerization",
            "Data consistency challenges in distributed transactions",
            "Increased operational complexity requiring dedicated DevOps support",
            "Cost of running Kubernetes cluster may exceed budget for smaller deployments",
        ],
        "recommendations": [
            "Start with a pilot migration of 2-3 services before full rollout",
            "Invest in team training for Docker, Kubernetes, and microservices patterns",
            "Implement circuit breaker pattern to handle service failures gracefully",
            "Use API gateway for request routing, rate limiting, and authentication",
            "Adopt infrastructure-as-code with Terraform for reproducible environments",
            "Establish SLOs and error budgets to guide reliability improvements",
        ],
        "metrics": [
            {"label": "System Uptime", "value": "99.9%", "category": "performance"},
            {"label": "Cost Reduction", "value": "35%", "category": "cost"},
            {"label": "Concurrent Users", "value": "10,000", "category": "performance"},
            {"label": "Response Time", "value": "<200ms", "category": "performance"},
            {"label": "Database Load Reduction", "value": "60%", "category": "performance"},
            {"label": "Deployment Time Reduction", "value": "85%", "category": "performance"},
            {"label": "Project Timeline", "value": "Q3 2026", "category": "date"},
            {"label": "Model Accuracy", "value": "94.5%", "category": "accuracy"},
        ],
        "keywords": [
            "Microservices", "Containerization", "Kubernetes", "Event-Driven Architecture",
            "CI/CD", "Redis Caching", "OAuth 2.0", "Distributed Tracing", "Horizontal Scaling",
            "API Gateway", "Infrastructure as Code", "Observability", "Load Balancing",
            "Service Mesh", "Zero-Downtime Deployment",
        ],
        "glossary": [
            {"term": "Microservices", "definition": "An architectural style that structures an application as a collection of loosely coupled, independently deployable services"},
            {"term": "Containerization", "definition": "Packaging software code with its dependencies into standardized units called containers"},
            {"term": "Kubernetes", "definition": "An open-source platform for automating deployment, scaling, and management of containerized applications"},
            {"term": "CI/CD", "definition": "Continuous Integration and Continuous Deployment - automated software delivery practices"},
            {"term": "OAuth 2.0", "definition": "An authorization framework that enables applications to obtain limited access to user accounts"},
            {"term": "Distributed Tracing", "definition": "A method of tracking requests as they flow through distributed systems"},
            {"term": "API Gateway", "definition": "A server that acts as an entry point for API requests, handling routing, composition, and protocol translation"},
            {"term": "Infrastructure as Code", "definition": "Managing and provisioning infrastructure through machine-readable definition files"},
        ],
        "section_summaries": [
            {"title": "Introduction", "summary": "The introduction establishes the context for a modern distributed architecture, outlining the challenges of scalability and operational efficiency in enterprise systems."},
            {"title": "System Architecture", "summary": "The architecture section details a microservices-based design with event-driven communication, containerization, and comprehensive observability."},
            {"title": "Performance Analysis", "summary": "Performance benchmarks demonstrate the system's capability to handle 10,000 concurrent users with sub-200ms response times and 99.9% uptime."},
            {"title": "Security Considerations", "summary": "Security is addressed through OAuth 2.0, TLS encryption, regular penetration testing, and secure coding practices."},
            {"title": "Deployment Strategy", "summary": "The deployment strategy leverages Kubernetes orchestration with automated CI/CD pipelines for zero-downtime deployments."},
        ],
        "timeline": [
            {"event": "Project Initiation", "date": "Q1 2026", "type": "milestone"},
            {"event": "Architecture Design Phase", "date": "Q1 2026", "type": "phase"},
            {"event": "Core Service Development", "date": "Q2 2026", "type": "phase"},
            {"event": "Integration Testing", "date": "Q2 2026", "type": "phase"},
            {"event": "Security Audit", "date": "Q3 2026", "type": "deadline"},
            {"event": "Production Deployment", "date": "Q3 2026", "type": "milestone"},
        ],
        "knowledge_graph": {
            "nodes": [
                {"id": "1", "label": "Microservices", "type": "concept"},
                {"id": "2", "label": "Kubernetes", "type": "technology"},
                {"id": "3", "label": "Event-Driven", "type": "concept"},
                {"id": "4", "label": "Docker", "type": "technology"},
                {"id": "5", "label": "OAuth 2.0", "type": "technology"},
                {"id": "6", "label": "Redis", "type": "technology"},
                {"id": "7", "label": "Scalability", "type": "metric"},
                {"id": "8", "label": "API Gateway", "type": "concept"},
                {"id": "9", "label": "CI/CD Pipeline", "type": "method"},
                {"id": "10", "label": "99.9% Uptime", "type": "metric"},
            ],
            "edges": [
                {"source": "1", "target": "2", "label": "orchestrated by"},
                {"source": "1", "target": "3", "label": "uses"},
                {"source": "1", "target": "4", "label": "packaged in"},
                {"source": "1", "target": "8", "label": "accessed via"},
                {"source": "1", "target": "7", "label": "achieves"},
                {"source": "2", "target": "4", "label": "manages"},
                {"source": "5", "target": "8", "label": "secures"},
                {"source": "6", "target": "7", "label": "improves"},
                {"source": "9", "target": "2", "label": "deploys to"},
                {"source": "7", "target": "10", "label": "targets"},
            ],
        },
        "evaluation": {
            "rouge1": 0.82,
            "rouge2": 0.74,
            "rougeL": 0.78,
            "bertscore": 0.88,
            "compression_ratio": 3.2,
            "confidence": 0.91,
        },
    })


def parse_json_from_response(text: str) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(text[start:end])
        return json.loads(mock_ai_response(text))


# ---------------------------------------------------------------------------
# Firebase-friendly endpoints
# ---------------------------------------------------------------------------

@app.post("/api/extract")
async def extract_text(document_id: str = Form(...), file_url: str = Form(...), file_ext: str = Form(...)):
    try:
        resp = urllib.request.urlopen(file_url)
        file_bytes = resp.read()
    except Exception as e:
        raise HTTPException(400, f"Could not download file: {e}")

    if file_ext == "pdf":
        result = extract_text_from_pdf(file_bytes)
    elif file_ext in ("docx", "doc"):
        result = extract_text_from_docx(file_bytes)
    else:
        result = {
            "full_text": file_bytes.decode("utf-8", errors="replace"),
            "sections": [{"title": "Document", "content": file_bytes.decode("utf-8", errors="replace")}],
            "page_count": 1,
        }

    return result


@app.post("/api/analyze")
async def analyze_document(
    document_id: str = Form(...),
    filename: str = Form(...),
    raw_text: str = Form(...),
    settings: str = Form("{}"),
):
    settings_dict = json.loads(settings) if settings else {}
    raw_text = raw_text[:30000]
    word_count = len(raw_text.split())

    prompt = SYSTEM_PROMPT.format(
        filename=filename,
        wordCount=word_count,
        rawText=raw_text,
        summaryLength=settings_dict.get("summaryLength", "medium"),
        creativity=settings_dict.get("creativity", 0.5),
        language=settings_dict.get("language", "English"),
    )

    temperature = float(settings_dict.get("temperature", 0.3))
    response_text = call_gemini(prompt, temperature=temperature)
    analysis = parse_json_from_response(response_text)
    analysis["document_id"] = document_id

    return {"document_id": document_id, "analysis": analysis}


@app.post("/api/chat")
async def chat_with_document(
    document_id: str = Form(...),
    raw_text: str = Form(...),
    filename: str = Form("document"),
    findings: str = Form("[]"),
    keywords: str = Form("[]"),
    question: str = Form(...),
):
    try:
        findings_list = json.loads(findings)
    except json.JSONDecodeError:
        findings_list = []

    try:
        keywords_list = json.loads(keywords)
    except json.JSONDecodeError:
        keywords_list = []

    doc_text = raw_text[:25000]
    findings_str = "\n".join(f"- {f}" for f in findings_list) or "No findings available"
    keywords_str = ", ".join(keywords_list) or "General"

    prompt = CHAT_PROMPT.format(
        filename=filename,
        docText=doc_text,
        findings=findings_str,
        keywords=keywords_str,
        question=question,
    )

    response = call_gemini(prompt, temperature=0.2, max_tokens=2048)
    return {"answer": response}


@app.post("/api/compare")
async def compare_documents(
    doc1_id: str = Form(...),
    doc1_text: str = Form(""),
    doc1_name: str = Form("Document 1"),
    doc2_id: str = Form(...),
    doc2_text: str = Form(""),
    doc2_name: str = Form("Document 2"),
):
    prompt = COMPARE_PROMPT.format(
        doc1Name=doc1_name,
        doc1Text=doc1_text[:15000],
        doc2Name=doc2_name,
        doc2Text=doc2_text[:15000],
    )

    response_text = call_gemini(prompt, temperature=0.2)
    comparison = parse_json_from_response(response_text)

    result = {
        "doc1": {"id": doc1_id, "filename": doc1_name},
        "doc2": {"id": doc2_id, "filename": doc2_name},
        **comparison,
    }
    return result


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()
    file_ext = file.filename.split(".")[-1].lower() if "." in file.filename else "txt"

    if file_ext == "pdf":
        result = extract_text_from_pdf(content)
    elif file_ext in ("docx", "doc"):
        result = extract_text_from_docx(content)
    else:
        result = {
            "full_text": content.decode("utf-8", errors="replace"),
            "sections": [{"title": "Document", "content": content.decode("utf-8", errors="replace")}],
            "page_count": 1,
        }

    return result


@app.get("/api/settings")
async def get_settings():
    return {
        "models": [
            {"id": "gemini-flash", "name": "Gemini 3 Flash", "provider": "Google"},
            {"id": "gemini-pro", "name": "Gemini 3.1 Pro", "provider": "Google"},
            {"id": "gpt-mini", "name": "GPT-5 Mini", "provider": "OpenAI"},
            {"id": "gpt", "name": "GPT-5", "provider": "OpenAI"},
            {"id": "claude-sonnet", "name": "Claude Sonnet 4.6", "provider": "Anthropic"},
            {"id": "claude-opus", "name": "Claude Opus 4.8", "provider": "Anthropic"},
        ]
    }


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "gemini_configured": bool(GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here"),
        "firebase_admin": db is not None,
    }


@app.post("/api/analyze-firestore")
async def analyze_firestore_document(document_id: str = Form(...), settings: str = Form("{}")):
    doc = get_firestore_doc("documents", document_id)
    if not doc:
        raise HTTPException(404, "Document not found in Firestore")

    settings_dict = json.loads(settings) if settings else {}
    raw_text = (doc.get("raw_text") or "")[:30000]
    word_count = len(raw_text.split())
    filename = doc.get("filename", "document")

    prompt = SYSTEM_PROMPT.format(
        filename=filename,
        wordCount=word_count,
        rawText=raw_text,
        summaryLength=settings_dict.get("summaryLength", "medium"),
        creativity=settings_dict.get("creativity", 0.5),
        language=settings_dict.get("language", "English"),
    )

    temperature = float(settings_dict.get("temperature", 0.3))
    response_text = call_gemini(prompt, temperature=temperature)
    analysis = parse_json_from_response(response_text)
    analysis["document_id"] = document_id
    analysis["created_at"] = datetime.now().isoformat()

    set_firestore_doc("analyses", document_id, analysis)
    doc["status"] = "ready"
    set_firestore_doc("documents", document_id, doc)

    return {"document_id": document_id, "analysis": analysis}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
