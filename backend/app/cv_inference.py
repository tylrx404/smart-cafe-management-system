"""
app/cv_inference.py
────────────────────
YOLOv8 computer-vision inference for civic issue detection.

The YOLO model file (yolov8n.pt) is expected inside backend/ (next to
the app/ folder), which is the working directory when uvicorn is started
from backend/.
"""

import os
from pathlib import Path

import cv2
import numpy as np

try:
    from ultralytics import YOLO
    # Resolve relative to backend/ (CWD when server starts)
    _model_path = Path(__file__).resolve().parent.parent / "yolov8n.pt"
    model = YOLO(str(_model_path)) if _model_path.exists() else YOLO("yolov8n.pt")
except ImportError:
    model = None  # type: ignore

# ── Label sets for COCO-trained YOLOv8 ───────────────────────────────────────
GARBAGE_LABELS = {
    "bottle", "cup", "wine glass", "fork", "knife", "spoon", "bowl",
    "banana", "apple", "sandwich", "orange", "broccoli", "carrot",
    "hot dog", "pizza", "donut", "cake",
}
ROAD_LABELS   = {"car", "truck", "bus", "motorcycle", "bicycle",
                 "stop sign", "fire hydrant", "parking meter"}
STREET_LABELS = {"traffic light"}


def process_civic_image(img_path: str):
    """
    Run YOLOv8 inference to detect civic issues using COCO dataset mappings,
    apply privacy blur to detected persons, and return (issue_type, confidence).

    Returns:
        (str, float) — issue label and highest confidence score.
    """
    if not model or not os.path.exists(img_path):
        return "Unknown", 0.0

    img = cv2.imread(img_path)
    if img is None:
        return "Unknown", 0.0

    results      = model(img)
    issue        = "Unknown"
    highest_conf = 0.0

    for r in results:
        boxes = r.boxes
        names = model.names

        for box in boxes:
            cls   = int(box.cls[0])
            conf  = float(box.conf[0])
            label = names[cls]

            # Skip low-confidence detections to avoid false positives
            if conf < 0.45:
                continue

            if label in GARBAGE_LABELS and conf > highest_conf:
                issue        = "Garbage"
                highest_conf = conf

            elif label in STREET_LABELS and conf > highest_conf:
                issue        = "Streetlight Issue"
                highest_conf = conf

            elif label in ROAD_LABELS and conf > highest_conf:
                if issue == "Unknown":
                    issue        = "Road Scene Detected"
                    highest_conf = conf

            # Privacy blur for detected persons
            if label == "person" and conf > 0.3:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                h, w = img.shape[:2]
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(w, x2), min(h, y2)
                roi = img[y1:y2, x1:x2]
                if roi.size != 0:
                    img[y1:y2, x1:x2] = cv2.GaussianBlur(roi, (51, 51), 30)

    # Write blurred image back to disk
    cv2.imwrite(img_path, img)

    if issue == "Garbage":
        return "Garbage", highest_conf
    if issue == "Streetlight Issue":
        return "Streetlight Issue", highest_conf
    if issue == "Road Scene Detected":
        # Cannot reliably detect potholes with COCO — report as Pothole with reduced confidence
        return "Pothole", highest_conf * 0.5

    return "Unknown", 0.0
