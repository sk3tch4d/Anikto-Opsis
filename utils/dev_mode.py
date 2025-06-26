# ==============================
# DEV_MODE.PY
# ==============================

from datetime import datetime
import hashlib

# ==============================
# CONSTANTS
# ==============================
CONSONANTS = "bcdfghjklmnpqrstvwxyz"
VOWELS = "aeiou"

# ==============================
# GENERATE DEV CODE
# ==============================
def generate_dev_code(secret="dev_salt", cycle_days=30, syllables=3):
    base_date = datetime(2020, 1, 1)
    today = datetime.today()
    days_since = (today - base_date).days
    cycle_index = days_since // cycle_days

    seed = int(hashlib.sha256(f"{secret}-{cycle_index}".encode()).hexdigest(), 16)
    word = ""
    for _ in range(syllables):
        c = CONSONANTS[seed % len(CONSONANTS)]
        seed //= len(CONSONANTS)
        v = VOWELS[seed % len(VOWELS)]
        seed //= len(VOWELS)
        word += c + v

    return word

# ==============================
# STANDALONE EXECUTION
# ==============================
if __name__ == "__main__":
    print(f"[DEV] Rolling Dev Code: {generate_dev_code()}")
