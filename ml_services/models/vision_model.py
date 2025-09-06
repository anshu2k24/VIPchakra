import numpy as np
from PIL import Image
import imagehash
from deepface import DeepFace
import cv2
import io
import os
from ultralytics import YOLO

# load YOLOv8 face model (NOT coco!)
yolo_model = YOLO("yolov8n-face.pt")

VIP_DB_PATH = "vip_db"  # relative to app.py inside ml_services

async def process_image(file):
    # read file into PIL
    contents = await file.read()
    pil_img = Image.open(io.BytesIO(contents)).convert("RGB")

    # perceptual hash for duplicate check
    phash = str(imagehash.phash(pil_img))

    # convert to np array (BGR for OpenCV)
    img_np = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

    results = []
    try:
        # run YOLO face detection
        detections = yolo_model(img_np)[0]

        for box in detections.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            face_crop = img_np[y1:y2, x1:x2]

            if face_crop.size == 0:
                continue

            recognized_vip = None
            distance = None

            try:
                df_results = DeepFace.find(
                    img_path=face_crop,
                    db_path=VIP_DB_PATH,
                    enforce_detection=False
                )

                if isinstance(df_results, list) and len(df_results) > 0 and not df_results[0].empty:
                    best_match = df_results[0].iloc[0]
                    recognized_vip = os.path.basename(os.path.dirname(best_match["identity"]))
                    distance = float(best_match["distance"])
            except Exception as e:
                recognized_vip = None
                distance = None

            # Draw rectangle + label on image
            cv2.rectangle(img_np, (x1, y1), (x2, y2), (0, 255, 0), 2)
            label = recognized_vip if recognized_vip else "Unknown"
            cv2.putText(img_np, label, (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

            results.append({
                "bbox": [x1, y1, x2, y2],
                "recognized_vip": recognized_vip,
                "distance": distance
            })

    except Exception as e:
        results = [{"error": f"YOLO detection failed: {str(e)}"}]

    # save annotated image to return (optional)
    _, buffer = cv2.imencode(".jpg", img_np)
    annotated_bytes = buffer.tobytes()

    return {
        "phash": phash,
        "faces": results,
        "annotated_image": annotated_bytes.hex()[:200]  # preview (first 200 chars hex)
    }
