import base64
import io
import math
from typing import Any
from app.config import get_settings

settings = get_settings()


def _to_float_list(descriptor: list[float]) -> list[float]:
    try:
        return [float(value) for value in descriptor]
    except (TypeError, ValueError) as exc:
        raise ValueError("Invalid face descriptor") from exc


def _vector_norm(vector: list[float]) -> float:
    return math.sqrt(sum(value * value for value in vector))


def normalize_descriptor(descriptor: list[float]) -> list[float]:
    vector = _to_float_list(descriptor)
    if len(vector) < 8:
        raise ValueError("Invalid face descriptor")
    norm = _vector_norm(vector)
    if norm == 0:
        raise ValueError("Descriptor norm cannot be zero")
    return [value / norm for value in vector]


def euclidean_distance(left: list[float], right: list[float]) -> float:
    if len(left) != len(right):
        raise ValueError("Descriptor shapes do not match")
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(left, right)))


def compare_descriptors(stored: list[float], candidate: list[float]) -> tuple[bool, float]:
    stored_vec = normalize_descriptor(stored)
    candidate_vec = normalize_descriptor(candidate)
    distance = euclidean_distance(stored_vec, candidate_vec)
    return distance <= settings.FACE_MATCH_THRESHOLD, float(distance)


def average_descriptors(samples: list[list[float]]) -> list[float]:
    vectors = [normalize_descriptor(sample) for sample in samples]
    if not vectors:
        raise ValueError("No descriptors provided")
    length = len(vectors[0])
    if any(len(vector) != length for vector in vectors):
        raise ValueError("Descriptor shapes do not match")
    mean = [sum(vector[index] for vector in vectors) / len(vectors) for index in range(length)]
    mean_norm = _vector_norm(mean)
    if mean_norm == 0:
        raise ValueError("Mean descriptor norm cannot be zero")
    return [float(value / mean_norm) for value in mean]


def validate_face_profile(profile: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(profile, dict):
        raise ValueError("Invalid face profile")

    center = normalize_descriptor(profile.get("center"))
    left = normalize_descriptor(profile.get("left"))
    right = normalize_descriptor(profile.get("right"))

    center_left = euclidean_distance(center, left)
    center_right = euclidean_distance(center, right)
    left_right = euclidean_distance(left, right)

    if center_left < settings.FACE_SIDE_MIN_DISTANCE or center_right < settings.FACE_SIDE_MIN_DISTANCE:
        raise ValueError("Face enrollment rejected because side captures are too similar to the front capture")

    average = average_descriptors([center, left, right])
    return {
        "version": 2,
        "poses": {
            "center": center,
            "left": left,
            "right": right,
        },
        "average": average,
        "distances": {
            "center_left": float(center_left),
            "center_right": float(center_right),
            "left_right": float(left_right),
        },
    }


def load_face_profile(raw: Any) -> dict[str, Any]:
    if isinstance(raw, dict):
        data = raw
    elif isinstance(raw, list):
        center = normalize_descriptor(raw)
        return {"version": 1, "poses": {"center": center}, "average": center}
    else:
        raise ValueError("Invalid face profile")

    if "poses" in data:
        poses = data["poses"]
        center = normalize_descriptor(poses.get("center"))
        left = poses.get("left")
        right = poses.get("right")
        normalized = {"center": center}
        if left is not None:
            normalized["left"] = normalize_descriptor(left)
        if right is not None:
            normalized["right"] = normalize_descriptor(right)

        average = data.get("average")
        average = normalize_descriptor(average) if average is not None else average_descriptors(list(normalized.values()))
        return {"version": data.get("version", 2), "poses": normalized, "average": average}

    if {"center", "left", "right"}.issubset(set(data.keys())):
        return validate_face_profile(data)

    if "center" in data:
        center = normalize_descriptor(data["center"])
        return {"version": data.get("version", 1), "poses": {"center": center}, "average": center}

    raise ValueError("Invalid face profile")


def compare_candidate_to_profile(stored_profile: Any, candidate: list[float]) -> tuple[bool, dict[str, float]]:
    profile = load_face_profile(stored_profile)
    candidate_vec = normalize_descriptor(candidate)

    center_distance = euclidean_distance(profile["poses"]["center"], candidate_vec)
    average_distance = euclidean_distance(profile["average"], candidate_vec)
    best_pose_distance = min(euclidean_distance(vector, candidate_vec) for vector in profile["poses"].values())

    matched = (
        center_distance <= settings.FACE_MATCH_THRESHOLD
        and average_distance <= settings.FACE_AVERAGE_THRESHOLD
        and best_pose_distance <= settings.FACE_AVERAGE_THRESHOLD
    )

    return matched, {
        "center_distance": float(center_distance),
        "average_distance": float(average_distance),
        "best_pose_distance": float(best_pose_distance),
    }


def extract_descriptor_from_base64_image(image_b64: str) -> list[float]:
    try:
        import face_recognition  # type: ignore
        from PIL import Image  # type: ignore
    except Exception as exc:
        raise RuntimeError(
            "Server-side image face extraction requires optional dependencies like face_recognition and Pillow."
        ) from exc

    binary = base64.b64decode(image_b64)
    image = Image.open(io.BytesIO(binary)).convert("RGB")
    array = image
    encodings = face_recognition.face_encodings(array)
    if not encodings:
        raise ValueError("No face detected in uploaded image")
    return normalize_descriptor(encodings[0].tolist())