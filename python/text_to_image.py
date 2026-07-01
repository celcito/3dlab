import torch
import gc

_pipe = None
_AutoPipelineForText2Image = None

def _get_pipeline_class():
    global _AutoPipelineForText2Image
    if _AutoPipelineForText2Image is None:
        from diffusers import AutoPipelineForText2Image
        _AutoPipelineForText2Image = AutoPipelineForText2Image
    return _AutoPipelineForText2Image

CLEAN_PROMPT_SUFFIX = (
    ", product photo, white background, studio lighting, "
    "single object, no shadows, centered"
)
MAX_PROMPT_TOKENS = 60


def _has_cuda() -> bool:
    try:
        return torch.cuda.is_available()
    except Exception:
        return False


def load_pipe(model_id: str = "stabilityai/sdxl-turbo"):
    global _pipe
    if _pipe is None:
        PipeClass = _get_pipeline_class()
        _pipe = PipeClass.from_pretrained(
            model_id,
            torch_dtype=torch.float16,
            variant="fp16",
        )
        _pipe.enable_attention_slicing()
        _pipe.enable_vae_slicing()
    return _pipe


def unload_pipe():
    global _pipe
    if _pipe is not None:
        try:
            _pipe.to("cpu")
        except Exception:
            pass
        del _pipe
        _pipe = None
        gc.collect()
        if _has_cuda():
            torch.cuda.empty_cache()


def _truncate_to_tokens(prompt: str, max_tokens: int) -> str:
    max_words = int(max_tokens * 0.75)
    words = prompt.split()
    if len(words) <= max_words:
        return prompt
    return " ".join(words[:max_words])


def generate_image(
    prompt: str,
    output_path: str,
    clean_prompt: bool = True,
    progress_callback=None,
) -> str:
    pipe = load_pipe()
    device = "cuda" if _has_cuda() else "cpu"
    pipe.to(device)

    full_prompt = prompt
    if clean_prompt:
        user_part = _truncate_to_tokens(prompt, MAX_PROMPT_TOKENS)
        full_prompt = user_part + CLEAN_PROMPT_SUFFIX

    if progress_callback:
        progress_callback(15, "generating_image")

    image = pipe(
        prompt=full_prompt,
        num_inference_steps=4,
        guidance_scale=0.0,
    ).images[0]

    image.save(output_path)
    unload_pipe()

    if progress_callback:
        progress_callback(35, "text_model_unloaded")

    return output_path
