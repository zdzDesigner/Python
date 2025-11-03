import tempfile
import asyncio
from io import FileIO

# def read_file_to_temp(spk_audio_prompt = FileIO(..., description="Reference audio file for the speaker's voice (timbre).")):
#     print("xx")

def read_file():
    with open("./if.py", "r") as f:
        # print(f.read())
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            val = f.read()
            temp_file.write(val.encode())


read_file()
# asyncio.run(read_file())




