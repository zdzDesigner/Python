import tempfile
import asyncio
from io import FileIO

# def read_file_to_temp(spk_audio_prompt = FileIO(..., description="Reference audio file for the speaker's voice (timbre).")):
#     print("xx")

def read_file(filepath_src):
    try:
         with open(filepath_src, "r") as f:
             # print(f.read())
             with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
                 val = f.read()
                 temp_file.write(val.encode())
                 return temp_file.name
    except Exception as e:
        return None



filepath = read_file("./if.py")
print(filepath)
# asyncio.run(read_file())




