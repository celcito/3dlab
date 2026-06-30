FROM pytorch/pytorch:2.4.0-cuda12.1-cudnn9-devel

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# TripoSR is not on PyPI — clone from GitHub and add to PYTHONPATH.
# The project has no setup.py; its code lives in the tsr/ subdirectory.
# We install only the inference dependencies (not gradio, moderngl, imageio, xatlas)
# to keep the image small and avoid heavy system deps.
RUN git clone --depth 1 https://github.com/VAST-AI-Research/TripoSR.git /opt/TripoSR && \
    pip install --no-cache-dir \
        omegaconf==2.3.0 \
        einops==0.7.0 \
        transformers==4.35.0 \
        huggingface-hub \
        trimesh==4.0.5 \
        "Pillow>=10.1.0" \
        "git+https://github.com/tatsy/torchmcubes.git" && \
    rm -rf /opt/TripoSR/.git

ENV PYTHONPATH="/opt/TripoSR:${PYTHONPATH}"

COPY app.py jobs.py triposr_runner.py convert.py decimate.py ./

RUN mkdir -p /tmp/jobs

EXPOSE 8001

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8001"]