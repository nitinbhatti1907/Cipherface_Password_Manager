from app.utils.face import compare_descriptors


def test_face_compare_accepts_close_descriptor():
    stored = [0.1, 0.2, 0.3, 0.4, 0.5, 0.2, 0.1, 0.7]
    candidate = [0.11, 0.19, 0.31, 0.39, 0.49, 0.21, 0.1, 0.69]
    matched, distance = compare_descriptors(stored, candidate)
    assert isinstance(distance, float)
    assert matched is True
