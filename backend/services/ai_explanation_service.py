from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()

client = OpenAI()

response = client.responses.create(
    model="gpt-4.1-mini",
    input="Write a short bedtime story about a unicorn."
)

print(response.output_text)