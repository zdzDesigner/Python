import os
import json
import tempfile
import uvicorn
from contextlib import asynccontextmanager
from typing import Optional, List

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse
# from indextts.infer_v2 import IndexTTS2

from starlette.background import BackgroundTask

# --- Global Model Holder ---
# Use a dictionary to hold the model, making it accessible within the lifespan context.
models = {}

def read_file(filepath_src):
    try:
        with open(filepath_src, "r") as f:
            # print(f.read())
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
                val = f.read()
                temp_file.write(val.encode())
                return temp_file.name
    except Exception as err:
        return None

# --- FastAPI App Initialization ---
app = FastAPI()

# --- API Endpoint Definition ---
@app.post(
    "/inference",
    summary="Generate speech from text and audio prompts",
    description="""
    Synthesizes speech based on a text input and a speaker reference audio.
    All parameters from the original `infer_v2.py` are exposed here.
    The generated audio is returned directly as a WAV file.
    """,
    response_class=FileResponse
)
async def run_inference(
    # --- Core Parameters ---
    text: str = Form(..., description="The text to be synthesized."),
    spk_audio_prompt: UploadFile = File(..., description="Reference audio file for the speaker's voice (timbre)."),

    # --- Emotion Control Parameters ---
    emo_audio_prompt: Optional[UploadFile] = File(None, description="Reference audio file for the desired emotion."),
    emo_alpha: float = Form(1.0, description="Blending ratio for the emotion reference audio. Range: 0.0 to 1.0."),
    emo_vector_str: Optional[str] = Form(None, description='A JSON string representing a list of 8 floats for emotion control. E.g., `"[0, 0, 0, 0, 0, 0, 0.45, 0]"`.'),
    use_emo_text: bool = Form(False, description="If True, derive emotions from the `emo_text` or the main `text`."),
    emo_text: Optional[str] = Form(None, description="Text to derive emotions from. If `use_emo_text` is True and this is empty, the main `text` is used."),

    # --- Generation Control Parameters ---
    use_random: bool = Form(False, description="If True, introduces randomness in emotion vector selection, potentially reducing voice cloning fidelity."),
    interval_silence: int = Form(200, description="Milliseconds of silence to insert between text segments."),
    max_text_tokens_per_segment: int = Form(120, description="Maximum number of text tokens for each synthesis segment."),
    
    # --- Additional Generation Kwargs from the original script ---
    top_p: float = Form(0.8, description="Top-p sampling probability."),
    top_k: int = Form(30, description="Top-k sampling."),
    temperature: float = Form(0.8, description="Sampling temperature."),
    length_penalty: float = Form(0.0, description="Length penalty for generation."),
    repetition_penalty: float = Form(10.0, description="Repetition penalty."),
    max_mel_tokens: int = Form(1500, description="Maximum number of mel tokens to generate."),

    verbose: bool = Form(False, description="Enable verbose logging.")
):

    temp_files = []
    output_path = None  # Track output path separately
    try:
        # --- Handle File Uploads ---
        # Create temporary files for uploaded audio prompts
        if spk_audio_prompt:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as spk_file:
                content = await spk_audio_prompt.read()
                spk_file.write(content)
                spk_audio_path = spk_file.name
                temp_files.append(spk_audio_path)  # This will be cleaned in finally
        
        if emo_audio_prompt:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as emo_file:
                content = await emo_audio_prompt.read()
                emo_file.write(content)
                emo_audio_path = emo_file.name
                temp_files.append(emo_audio_path)  # This will be cleaned in finally

        # --- Return Audio File ---
        # For mock, create a simple temp file with some mock audio content
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            # Write some simple mock audio data - real WAV header would be needed for actual audio
            # For now, just write some text as a placeholder
            mock_content = f"Mock TTS output for: {text}"
            temp_file.write(mock_content.encode())
            output_path = temp_file.name

        print(f"output_path: {output_path}")
        
        # --- Return Audio File ---
        # Use a BackgroundTask to delete the output file *after* the response is sent.
        return FileResponse(
            path=output_path,
            media_type='audio/wav',
            filename='generated_speech.wav',
            background=BackgroundTask(os.remove, output_path)
        )

    except Exception as e:
        # In case of any error, raise an HTTP exception
        # Also clean up the output file if it was created but something failed
        if output_path and os.path.exists(output_path):
            try:
                os.remove(output_path)
            except:
                pass  # Ignore cleanup errors in error handling
        print(f"ERROR:    An error occurred during inference: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # --- Cleanup ---
        # Clean up ONLY the INPUT temporary files (audio prompts), not the output file.
        # The output file will be cleaned up by the BackgroundTask after the response is sent.
        for path in temp_files:
            try:
                if path != output_path and os.path.exists(path):  # Don't remove output_path here
                    os.remove(path)
            except Exception as e:
                print(f"WARNING: Could not remove temporary file {path}: {e}")
                
        print("INFO:     Cleaned up temporary input files.")


# --- Main Execution Block ---
if __name__ == "__main__":
    print("--- IndexTTS2 FastAPI Server ---")
    print("Starting server. The model will be loaded shortly.")
    print("Access the interactive API documentation at http://127.0.0.1:8000/docs")
    
    # Use uvicorn to run the app.
    # Set host to '0.0.0.0' to make it accessible from other devices on the network.
    uvicorn.run(app, host="0.0.0.0", port=8800)

