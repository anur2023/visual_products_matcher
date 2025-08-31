from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import numpy as np
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel
from supabase_client import get_similar_products
import io
import os
import base64

app = FastAPI(title="Visual Product Matcher")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize CLIP model
device = "cuda" if torch.cuda.is_available() else "cpu"
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def clip_embed_image(img: Image.Image):
    inputs = processor(images=img, return_tensors="pt").to(device)
    with torch.no_grad():
        emb = model.get_image_features(**inputs)
    emb = emb / emb.norm(p=2, dim=-1, keepdim=True)
    return emb.cpu().numpy().flatten().tolist()

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Read and process the uploaded image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Generate embedding
        embedding = clip_embed_image(image)
        
        # Get similar products from Supabase
        similar_products = get_similar_products(embedding, limit=12)
        
        return JSONResponse({
            "success": True,
            "products": similar_products,
            "uploaded_image": image_to_base64(image)
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/url")
async def process_image_url(request: dict):
    try:
        import requests
        from io import BytesIO
        
        url = request.get("url")
        if not url:
            raise HTTPException(status_code=400, detail="URL is required")
        
        # Download image from URL
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        # Process the image
        image = Image.open(BytesIO(response.content)).convert("RGB")
        
        # Generate embedding
        embedding = clip_embed_image(image)
        
        # Get similar products from Supabase
        similar_products = get_similar_products(embedding, limit=12)
        
        return JSONResponse({
            "success": True,
            "products": similar_products,
            "uploaded_image": image_to_base64(image)
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def image_to_base64(image):
    buffered = io.BytesIO()
    image.save(buffered, format="JPEG")
    return base64.b64encode(buffered.getvalue()).decode()

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "Server is running"}

# Serve frontend files
app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")

@app.get("/")
async def read_index():
    return FileResponse("../frontend/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)