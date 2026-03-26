import secrets
import string
from app.schemas import PasswordStrengthResponse


def analyze_password(password: str) -> PasswordStrengthResponse:
    score = 0
    feedback: list[str] = []

    if len(password) >= 12:
        score += 25
    else:
        feedback.append("Use at least 12 characters.")

    if any(ch.islower() for ch in password):
        score += 15
    else:
        feedback.append("Add lowercase letters.")

    if any(ch.isupper() for ch in password):
        score += 15
    else:
        feedback.append("Add uppercase letters.")

    if any(ch.isdigit() for ch in password):
        score += 15
    else:
        feedback.append("Add numbers.")

    if any(ch in string.punctuation for ch in password):
        score += 15
    else:
        feedback.append("Add symbols for stronger entropy.")

    repeated = any(password.count(ch * 3) > 0 for ch in set(password)) if password else False
    if repeated:
        feedback.append("Avoid repeated patterns.")
    else:
        score += 15

    score = min(score, 100)

    if score <= 25:
        label = "Weak"
    elif score <= 50:
        label = "Fair"
    elif score <= 75:
        label = "Good"
    else:
        label = "Strong"

    if not feedback:
        feedback = ["This password looks strong."]

    return PasswordStrengthResponse(score=score, label=label, feedback=feedback)


def generate_password(length: int = 18, include_symbols: bool = True) -> str:
    alphabet = string.ascii_letters + string.digits
    if include_symbols:
        alphabet += "!@#$%^&*()-_=+?"

    while True:
        password = "".join(secrets.choice(alphabet) for _ in range(length))
        analysis = analyze_password(password)
        if analysis.score >= 80:
            return password
