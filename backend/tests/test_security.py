from app.security import decrypt_secret, encrypt_secret


def test_encrypt_decrypt_round_trip():
    encrypted, nonce = encrypt_secret("super-secret-password")
    decrypted = decrypt_secret(encrypted, nonce)
    assert decrypted == "super-secret-password"
