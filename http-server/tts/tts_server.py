import os
import json
import tempfile
import uvicorn
from contextlib import asynccontextmanager
from typing import Optional, List

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse
from indextts.infer_v2 import IndexTTS2

from starlette.background import BackgroundTask

# --- Global Model Holder ---
# Use a dictionary to hold the model, making it accessible within the lifespan context.
models = {}

# --- FastAPI Lifespan Management ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    启动执行
    Manages the model's lifecycle. The model is loaded on startup and cleared on shutdown.
    """
    print("INFO:     Loading IndexTTS2 model...")
    # Load the TTS model with your desired default settings.
    # These can be configured via environment variables or a config file in a real application.
    models['tts'] = IndexTTS2(
        cfg_path="checkpoints/config.yaml",
        model_dir="checkpoints",
        use_fp16=False,       # Set to True for faster inference on supported GPUs
        use_cuda_kernel=True, # Set to True for BigVGAN speedup on CUDA
        use_deepspeed=False   # Set to True to try DeepSpeed acceleration
    )
    print("INFO:     Model loaded successfully.")
    
    yield  # API is ready to serve requests
    
    """
    停止服务(销毁)
    """
    # Clean up resources on shutdown
    print("INFO:     Unloading model.")
    models.clear()

# --- FastAPI App Initialization ---
app = FastAPI(lifespan=lifespan)

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
    """
    The main endpoint to perform Text-to-Speech synthesis.
    """
    if 'tts' not in models:
        raise HTTPException(status_code=503, detail="Model is not loaded yet. Please wait a moment and try again.")
    
    tts_model = models['tts']
    temp_files = []

    try:
        # --- Handle File Uploads ---
        # Create temporary files for uploaded audio prompts
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as spk_file:
            content = await spk_audio_prompt.read()
            spk_file.write(content)
            spk_audio_path = spk_file.name
            temp_files.append(spk_audio_path)

        emo_audio_path = None
        if emo_audio_prompt:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as emo_file:
                content = await emo_audio_prompt.read()
                emo_file.write(content)
                emo_audio_path = emo_file.name
                temp_files.append(emo_audio_path)

        # --- Handle Emotion Vector ---
        emo_vector = None
        if emo_vector_str:
            try:
                emo_vector = json.loads(emo_vector_str)
                if not (isinstance(emo_vector, list) and all(isinstance(i, (int, float)) for i in emo_vector)):
                    raise ValueError("Emotion vector must be a list of numbers.")
            except (json.JSONDecodeError, ValueError) as e:
                raise HTTPException(status_code=400, detail=f"Invalid format for emo_vector_str: {e}")

        # --- Prepare for Inference ---
        # Create a temporary file for the output
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as out_file:
            output_path = out_file.name
            temp_files.append(output_path)

        # Collect generation kwargs
        generation_kwargs = {
            "top_p": top_p,
            "top_k": top_k,
            "temperature": temperature,
            "length_penalty": length_penalty,
            "repetition_penalty": repetition_penalty,
            "max_mel_tokens": max_mel_tokens,
        }

        # --- Run Inference ---
        print(f"INFO:     Starting inference for text: '{text[:50]}...'")
        tts_model.infer(
            spk_audio_prompt=spk_audio_path,
            text=text,
            output_path=output_path,
            emo_audio_prompt=emo_audio_path,
            emo_alpha=emo_alpha,
            emo_vector=emo_vector,
            use_emo_text=use_emo_text,
            emo_text=emo_text,
            use_random=use_random,
            interval_silence=interval_silence,
            verbose=verbose,
            max_text_tokens_per_segment=max_text_tokens_per_segment,
            **generation_kwargs
        )
        print(f"INFO:     Inference successful. Audio saved to temporary file: {output_path}")

        # --- Return Audio File ---
        # Use a BackgroundTask to delete the output file *after* the response is sent.
        return FileResponse(
            path=output_path,
            media_type='audio/wav',
            filename='generated_speech.wav',
            background=BackgroundTask(os.remove, output_path)
        )

    except HTTPException:
        # Re-raise HTTP exceptions without modification
        raise
    except Exception as e:
        # In case of any error, raise an HTTP exception
        # Also clean up the output file if it was created but inference failed
        if output_path and os.path.exists(output_path):
            try:
                os.remove(output_path)
            except:
                pass  # Ignore cleanup errors in error handling
        print(f"ERROR:    An error occurred during inference: {e}")
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
    
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
    uvicorn.run(app, host="0.0.0.0", port=8900)

