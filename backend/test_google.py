import google.generativeai as genai


api_key = "AIzaSyA6a48d0pJB4keC2QJfQpg6X2n5X1xu57k"

genai.configure(api_key=api_key)

models_to_test = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash" 
]

print("📡 Pinging Google AI Servers...\n")

for m in models_to_test:
    try:
        model = genai.GenerativeModel(m)
        response = model.generate_content("Say exactly: Connection OK")
        print(f"✅ {m:25s} → {response.text.strip()}")
    except Exception as e:
        print(f"❌ {m:25s} → FAILED: {str(e)[:150]}")