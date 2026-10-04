import os
from google import genai

key = os.getenv("GEMINI_API_KEY")

print("Key:", key[:8] if key else None)

client = genai.Client(api_key=key)

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Say hello"
)

print(response.text)