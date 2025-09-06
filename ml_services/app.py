from fastapi import FastAPI
from routers import text_router, image_router
app = FastAPI(
    title="VipChakra ML Service",
    description="AI service for VIP threat & misinformation monitoring",
    version="0.1.0"
)

# register routers
app.include_router(text_router.router, prefix="/analyze/text", tags=["Text Analysis"])
app.include_router(image_router.router, prefix="/analyze/image", tags=["Image Analysis"])

@app.get("/")
def root():
    return {"msg": "VipChakra ML service running 🚀"}
