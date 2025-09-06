import os
import torch
from sentence_transformers import SentenceTransformer, util

# --- Configuration & Model Loading (Global) ---
REUSE_THRESHOLD = 0.7  # Similarity score threshold for flagging reused content

try:
    sbert = SentenceTransformer("all-MiniLM-L6-v2")
except Exception as e:
    print(f"Error loading SentenceTransformer model: {e}")
    sbert = None


def get_embedding_and_check_reuse(text: str, existing_embeddings: list[list[float]]):
    """
    Generates an embedding for the input text and checks for content reuse
    against a list of existing embeddings.
    """
    if not sbert:
        raise RuntimeError("SentenceTransformer model is not loaded.")

    # Step 1: Generate embedding for the new text
    new_embedding = sbert.encode(text).tolist()

    # Step 2: Check for content reuse against existing embeddings
    is_reused_content = False
    if existing_embeddings:
        try:
            # The list of lists needs to be converted to a tensor
            existing_tensors = torch.tensor(existing_embeddings)

            # The new embedding also needs to be a tensor for comparison
            new_embedding_tensor = torch.tensor(new_embedding)

            # Calculate cosine similarity between new embedding and all existing embeddings
            similarities = util.cos_sim(new_embedding_tensor, existing_tensors)[0]

            # Check if any similarity score exceeds the threshold
            if any(sim.item() > REUSE_THRESHOLD for sim in similarities):
                is_reused_content = True
        except Exception as e:
            # We print the error here for debugging purposes.
            print(f"Error checking for content reuse: {e}")

    return {
        "is_reused_content": is_reused_content,
        "new_embedding": new_embedding
    }
