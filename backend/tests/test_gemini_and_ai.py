import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app
from app.services.database_service import init_db
from app.services.gemini_service import gemini_service

@pytest.fixture(autouse=True)
def setup_database():
    init_db()

def test_ask_field_gemini_key_missing():
    """Verify Ask My Field provides structured deterministic fallback when GEMINI_API_KEY is not set."""
    with TestClient(app) as client:
        # Ensure gemini service has empty key for this test
        orig_key = gemini_service.api_key
        gemini_service.api_key = ""
        try:
            payload = {
                "field_id": 1,
                "question": "Should I irrigate today?"
            }
            res = client.post("/api/assistant", json=payload)
            assert res.status_code == 200
            data = res.json()
            assert data["mode"] == "DETERMINISTIC_FALLBACK"
            assert data["ai_status"] == "UNAVAILABLE"
            assert "AI assistant unavailable" in data["disclaimer"]
            assert data["answer"] is not None
            assert data["why"] is not None
            assert data["recommended_action"] is not None
            assert data["limitations"] is not None
            assert isinstance(data["data_used"], list)
            assert isinstance(data["transparency_summary"], list)
        finally:
            gemini_service.api_key = orig_key

def test_ask_field_structured_sections():
    """Verify that every response adheres strictly to the 5-part decision support schema."""
    with TestClient(app) as client:
        payload = {
            "field_id": 2, # Ludhiana Wheat
            "question": "Why is my field at risk?"
        }
        res = client.post("/api/assistant", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "answer" in data
        assert "why" in data
        assert "data_used" in data
        assert "recommended_action" in data
        assert "limitations" in data
        assert "transparency_summary" in data

def test_ask_field_missing_ndvi_handling():
    """Verify that when spectral NDVI is unavailable, the response explicitly acknowledges it without guessing."""
    with TestClient(app) as client:
        payload = {
            "field_id": 1,
            "question": "What does satellite imagery say about my crop health and NDVI?"
        }
        res = client.post("/api/assistant", json=payload)
        assert res.status_code == 200
        data = res.json()
        # Must explicitly acknowledge that NDVI is unavailable
        combined_text = f"{data['answer']} {data['why']}".lower()
        assert "unavailable" in combined_text or "unretrieved" in combined_text

def test_ask_field_missing_soil_handling():
    """Field 3 (Nashik) has UNAVAILABLE soil data. Response must acknowledge missing lab test."""
    with TestClient(app) as client:
        payload = {
            "field_id": 3,
            "question": "What is my soil status and fertilizer advice?"
        }
        res = client.post("/api/assistant", json=payload)
        assert res.status_code == 200
        data = res.json()
        combined_text = f"{data['answer']} {data['why']} {' '.join(data['data_used'])}".lower()
        assert "unavailable" in combined_text or "generic" in combined_text

def test_ask_field_mocked_gemini_ai():
    """Verify successful Gemini AI reasoning integration with mocked API response."""
    mock_gemini_json = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": '{"answer": "Delaying irrigation for 24-48 hours is prudent.", "why": "Rainfall probability is elevated and wind speeds are high.", "data_used": ["Open-Meteo Weather (30.0C)", "Irrigation Risk Engine"], "recommended_action": "Postpone canal release and monitor evening cloud cover.", "limitations": "Convective rainfall can vary locally across village plots."}'
                        }
                    ]
                }
            }
        ]
    }
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_resp = AsyncMock()
        mock_resp.status_code = 200
        mock_resp.json = lambda: mock_gemini_json
        mock_post.return_value = mock_resp

        orig_key = gemini_service.api_key
        gemini_service.api_key = "AIzaSyMockedKeyForTestingPurposesOnly"
        try:
            with TestClient(app) as client:
                res = client.post("/api/assistant", json={"field_id": 1, "question": "Should I irrigate today?"})
                assert res.status_code == 200
                data = res.json()
                assert data["mode"] == "GEMINI_AI"
                assert data["ai_status"] == "CONFIGURED"
                assert "Delaying irrigation" in data["answer"]
                assert "Rainfall probability" in data["why"]
        finally:
            gemini_service.api_key = orig_key

def test_disease_unsupported_format_rejected():
    """Image screening must reject non-image file types (e.g. text, pdf)."""
    with TestClient(app) as client:
        files = {"file": ("test.txt", b"not an image", "text/plain")}
        res = client.post("/api/disease/analyze", files=files)
        assert res.status_code == 400
        assert "Unsupported image format" in res.json()["detail"]

def test_disease_oversized_file_rejected():
    """Image screening must reject files exceeding 10MB limit."""
    with TestClient(app) as client:
        # Create dummy 11MB payload
        large_bytes = b"0" * (11 * 1024 * 1024)
        files = {"file": ("large.jpg", large_bytes, "image/jpeg")}
        res = client.post("/api/disease/analyze", files=files)
        assert res.status_code == 400
        assert "exceeds 10MB limit" in res.json()["detail"]

def test_disease_screening_gemini_unavailable():
    """When GEMINI_API_KEY is not configured, disease endpoint returns AI_UNAVAILABLE with disclaimer."""
    with TestClient(app) as client:
        orig_key = gemini_service.api_key
        gemini_service.api_key = ""
        try:
            # Minimal 1x1 JPEG dummy
            jpeg_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9"
            files = {"file": ("leaf.jpg", jpeg_bytes, "image/jpeg")}
            res = client.post("/api/disease/analyze", files=files)
            assert res.status_code == 200
            data = res.json()
            assert data["status"] == "AI_UNAVAILABLE"
            assert data["detected_issue"] == "Image AI Unavailable"
            assert "AI-assisted screening — not laboratory diagnosis." in data["disclaimer"]
        finally:
            gemini_service.api_key = orig_key

def test_disease_screening_mocked_gemini():
    """Verify multimodal Gemini disease screening with non-definitive wording."""
    mock_disease_json = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": '{"detected_issue": "Possible signs consistent with Early Leaf Spot (Cercospora)", "visible_symptoms": "Circular brown lesions with chlorotic yellow halo visible on leaf margin.", "confidence_level": "Moderate", "suggested_actions": ["Remove and safely destroy severely infected lower leaves.", "Apply approved neem-based biopesticide or copper oxychloride as per KVK advisory."], "limitations": "Visual symptoms overlap between fungal leaf spot and bacterial blight; microscopic assay required for confirmation."}'
                        }
                    ]
                }
            }
        ]
    }
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_resp = AsyncMock()
        mock_resp.status_code = 200
        mock_resp.json = lambda: mock_disease_json
        mock_post.return_value = mock_resp

        orig_key = gemini_service.api_key
        gemini_service.api_key = "AIzaSyMockedKeyForTestingPurposesOnly"
        try:
            with TestClient(app) as client:
                jpeg_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xd9"
                files = {"file": ("leaf.jpg", jpeg_bytes, "image/jpeg")}
                res = client.post("/api/disease/analyze", files=files)
                assert res.status_code == 200
                data = res.json()
                assert data["status"] == "SUCCESS"
                assert "Possible signs consistent with" in data["detected_issue"]
                assert data["confidence_level"] == "Moderate"
                assert "AI-assisted screening — not laboratory diagnosis." in data["disclaimer"]
        finally:
            gemini_service.api_key = orig_key

def test_disease_screening_with_registered_crop_and_history():
    """Verify screening uses registered crop context and saves to field history."""
    with TestClient(app) as client:
        jpeg_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xd9"
        files = {"file": ("paddy_leaf.jpg", jpeg_bytes, "image/jpeg")}
        data_form = {"field_id": "1"} # Field 1 is Erode Rice/Paddy

        res = client.post("/api/disease/analyze", files=files, data=data_form)
        assert res.status_code == 200
        analysis = res.json()
        assert analysis["field_id"] == 1
        assert "Rice" in analysis["crop_context"] or "Paddy" in analysis["crop_context"]
        assert analysis["saved_to_history"] is True
        assert analysis["id"] is not None

        # Verify retrieved in field history
        hist_res = client.get("/api/disease/fields/1/history")
        assert hist_res.status_code == 200
        history = hist_res.json()
        assert len(history) >= 1
        latest = history[0]
        assert latest["field_id"] == 1
        assert latest["crop_context"] == "Rice (Paddy)"
        assert len(latest["suggested_actions"]) > 0

def test_disease_screening_with_language():
    """Verify screening accepts language parameter (e.g. Tamil 'ta') and passes it to reasoning pipeline."""
    mock_disease_json = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": '{"detected_issue": "இலைக்கருகல் நோய் சாத்தியக்கூறுகள் (Bacterial Leaf Blight)", "visible_symptoms": "இலையின் விளிம்புகளில் நீர் ஊறிய மஞ்சள் நிறக் கோடுகள் காணப்படுகின்றன.", "confidence_level": "மிதமான (Moderate)", "suggested_actions": ["நைட்ரஜன்/யூரியா உரம் போடுவதை தற்காலிகமாக குறைக்கவும்.", "சூடோமோனாஸ் புளோரசன்ஸ் 10 கிராம்/லிட்டர் தண்ணீரில் கலந்து தெளிக்கவும்."], "limitations": "கண்ணால் பார்க்கும் ஆய்வு மட்டுமே — ஆய்வக பரிசோதனை அல்ல."}'
                        }
                    ]
                }
            }
        ]
    }
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_resp = AsyncMock()
        mock_resp.status_code = 200
        mock_resp.json = lambda: mock_disease_json
        mock_post.return_value = mock_resp

        orig_key = gemini_service.api_key
        gemini_service.api_key = "AIzaSyMockedKeyForTestingPurposesOnly"
        try:
            with TestClient(app) as client:
                jpeg_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xd9"
                files = {"file": ("leaf.jpg", jpeg_bytes, "image/jpeg")}
                data = {"language": "ta", "crop_type": "Rice (Paddy)"}
                res = client.post("/api/disease/analyze", files=files, data=data)
                assert res.status_code == 200
                res_data = res.json()
                assert res_data["status"] == "SUCCESS"
                assert "இலைக்கருகல்" in res_data["detected_issue"]
                # Verify prompt sent to Gemini included language directive
                call_args = mock_post.call_args
                assert "Tamil" in str(call_args)
        finally:
            gemini_service.api_key = orig_key

