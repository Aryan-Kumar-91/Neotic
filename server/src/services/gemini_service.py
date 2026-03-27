import google.generativeai as genai
import re
from src.config.env import GOOGLE_API_KEY

genai.configure(api_key=GOOGLE_API_KEY)

# [DYNAMIC MODEL SELECTION] 
# We iterate over the developer's available Gemini quotas to auto-bind to the best 'flash' model.
# This prevents backend crashing during a presentation if a specific model flag is temporarily revoked.
default_model_name = 'models/gemini-pro' # Ultimate fallback
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            if 'flash' in m.name and 'vision' not in m.name:
                default_model_name = m.name
                break
except Exception as e:
    print(f"Warning: Could not list models ({e}), falling back to {default_model_name}")

print(f"SUCCESS: Bound AI to model: {default_model_name}")
model = genai.GenerativeModel(default_model_name)

def generate_thoughts(prompt: str) -> dict:
    # [PROMPT ENGINEERING] Strictly injecting a JSON structural directive into the system prompt.
    # This guarantees the React-Flow frontend receives parsable node-edges for its reasoning graph.
    system_instr = "Respond ONLY with JSON. Schema: {\"thoughts\": [{\"step\": \"Analysis\", \"content\": \"...\"}], \"final_answer\": \"...\"}"
    full_prompt = f"{system_instr}\n\nUser Question: {prompt}"
    
    response = model.generate_content(full_prompt)
    print(f"AI Response received for: {prompt[:20]}...")

    # [PARSER] Sanitizing out markdown injected by LLMs (```json ... ```) to safely extract the raw dict.
    clean_text = re.sub(r'```json|```', '', response.text).strip()
    match = re.search(r'\{.*\}', clean_text, re.DOTALL)
    
    if not match:
        return {"thoughts": [], "final_answer": response.text}
        
    return clean_text
