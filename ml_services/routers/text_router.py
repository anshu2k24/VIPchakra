from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models.nlp_model import get_embedding_and_check_reuse

router = APIRouter()

# Pydantic Models for Request and Response
class EmbeddingRequest(BaseModel):
    text: str
    existing_embeddings: list[list[float]] = []

class EmbeddingResponse(BaseModel):
    is_reused_content: bool
    new_embedding: list[float]

@router.post("/", response_model=EmbeddingResponse)
async def analyze_text(request_data: EmbeddingRequest):
    """
    Generates an embedding for the input text and checks for content reuse
    against a list of existing embeddings.
    """
    try:
        result = get_embedding_and_check_reuse(
            request_data.text,
            request_data.existing_embeddings
        )
        return EmbeddingResponse(**result)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")