from app.utils.password_tools import analyze_password, generate_password


def test_password_strength_strong():
    result = analyze_password("StrongP@ssword2026!")
    assert result.score >= 80
    assert result.label == "Strong"


def test_generate_password_is_reasonably_strong():
    password = generate_password(18, include_symbols=True)
    result = analyze_password(password)
    assert len(password) == 18
    assert result.score >= 80
