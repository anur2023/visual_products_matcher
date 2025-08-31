# Visual Product Matcher

A web application that helps users find visually similar products based on uploaded images.

## Features

- Image upload via file selection or drag & drop
- URL-based image processing
- Visual similarity matching using CLIP embeddings
- Filter results by similarity score
- Mobile-responsive design

## Tech Stack

- **Backend**: FastAPI, Python, Supabase
- **Frontend**: HTML, CSS, JavaScript, Bootstrap
- **AI/ML**: Hugging Face Transformers (CLIP model)
- **Database**: Supabase with pgvector
- **Hosting**: Hugging Face Spaces

## Setup Instructions

1. Clone this repository
2. Set up environment variables:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_KEY`: Your Supabase service role key
3. Install dependencies: `pip install -r requirements.txt`
4. Run the application: `uvicorn main:app --host 0.0.0.0 --port 7860`

## Deployment to Hugging Face

1. Create a new Space on Hugging Face
2. Set the Space hardware to CPU Basic
3. Add your Supabase credentials as secrets in the Space settings
4. Push your code to the Space repository

## Database Setup

The application requires a Supabase database with a `products` table containing:
- Product metadata (name, category, price, etc.)
- CLIP embeddings vector column (512 dimensions)
- Image URLs

Use the provided data ingestion script to populate your database.