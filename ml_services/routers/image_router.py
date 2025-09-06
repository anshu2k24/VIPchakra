from fastapi import APIRouter, UploadFile, File
from models import vision_model

router = APIRouter()

@router.post("/")
async def analyze_image(file: UploadFile = File(...)):
    result = await vision_model.process_image(file)
    return result
