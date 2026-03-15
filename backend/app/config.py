import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
GOOGLE_CLOUD_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT", "")
GOOGLE_CLOUD_LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

MAX_FILE_SIZE_MB = 50
MAX_ROWS = 500_000
SUPPORTED_FORMATS = [".csv"]

INPUT_SAMPLE_RATE = 16000
OUTPUT_SAMPLE_RATE = 24000

APP_NAME = "livedata"
AGENT_MODEL = "gemini-2.5-flash"
LIVE_MODEL = "gemini-2.5-flash-native-audio-latest"
