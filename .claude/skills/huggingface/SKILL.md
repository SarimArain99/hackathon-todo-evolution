# Hugging Face Skill

**Source**: Context7 MCP - `/huggingface/huggingface_hub`, `/huggingface/datasets`, `/websites/huggingface_co_transformers`
**Benchmark Score**: 61.5-88.9 | **Code Snippets**: 13,000+ | **Reputation**: High

## Overview

Hugging Face is the platform for open-source machine learning. It provides the Transformers library, Datasets library, and Hub for sharing models and datasets.

## Key Concepts

### 1. Installation

```bash
pip install transformers
pip install datasets
pip install huggingface_hub

# With framework support
pip install transformers[torch]        # PyTorch
pip install transformers[tensorflow]   # TensorFlow
```

### 2. Loading Models

```python
from transformers import AutoModel, AutoTokenizer, pipeline

# Load model and tokenizer
model = AutoModel.from_pretrained("bert-base-uncased")
tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")

# Use pipeline for quick inference
classifier = pipeline("sentiment-analysis")
result = classifier("I love Docker and Hugging Face!")
```

### 3. Pipelines

```python
from transformers import pipeline

# Text Classification
classifier = pipeline("sentiment-analysis")

# Question Answering
qa = pipeline("question-answering")
result = qa(question="What is Docker?", context="Docker is a containerization platform...")

# Named Entity Recognition
ner = pipeline("ner")
result = ner("Hugging Face is based in New York.")

# Summarization
summarizer = pipeline("summarization")
result = summarizer("Long text to summarize...")

# Text Generation
generator = pipeline("text-generation")
result = generator("Once upon a time...")

# Zero-Shot Classification
classifier = pipeline("zero-shot-classification")
result = classifier("Docker is great!", candidate_labels=["technology", "cooking"])

# Image Classification
classifier = pipeline("image-classification")
result = classifier("path/to/image.jpg")

# Automatic Speech Recognition
asr = pipeline("automatic-speech-recognition")
result = asr("audio.wav")
```

### 4. Datasets Library

```python
from datasets import load_dataset

# Load dataset
dataset = load_dataset('rajpurkar/squad')

# Load specific split
train_data = load_dataset('cornell-movie-review-data/rotten_tomatoes', split='train')

# Process dataset
dataset_with_length = dataset.map(lambda x: {"length": len(x["context"])})

# Tokenize (batched)
from transformers import AutoTokenizer
tokenizer = AutoTokenizer.from_pretrained('bert-base-cased')
tokenized_dataset = dataset.map(
    lambda x: tokenizer(x['context']),
    batched=True
)

# List all datasets
from huggingface_hub import list_datasets
print([d.id for d in list_datasets()])
```

### 5. Inference API

```python
from huggingface_hub import InferenceClient

# Initialize client
client = InferenceClient(model="meta-llama/Meta-Llama-3-8B-Instruct")

# Text generation
response = client.text_generation("The future of AI is", max_tokens=100)

# Chat completion
messages = [{"role": "user", "content": "What is Docker?"}]
response = client.chat_completion(messages=messages, max_tokens=100)
print(response.choices[0].message.content)

# Streaming
stream = client.chat_completion(messages=messages, stream=True)
for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")

# Image generation
image = client.text_to_image("a beautiful sunset")
image.save("sunset.png")

# Feature extraction (embeddings)
embeddings = client.feature_extraction("Hello, world!")
```

### 6. Training with Trainer

```python
from transformers import (
    Trainer,
    TrainingArguments,
    AutoModelForSequenceClassification,
    AutoTokenizer
)

# Load model
model = AutoModelForSequenceClassification.from_pretrained("bert-base-uncased")
tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")

# Training arguments
training_args = TrainingArguments(
    output_dir="./results",
    learning_rate=2e-5,
    per_device_train_batch_size=16,
    num_train_epochs=3,
    eval_strategy="epoch",
)

# Initialize trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_datasets["train"],
    eval_dataset=tokenized_datasets["test"],
    processing_class=tokenizer,
)

# Train
trainer.train()

# Save
trainer.save_model("./my-model")
```

### 7. Async Inference

```python
from huggingface_hub import AsyncInferenceClient
import asyncio

async def main():
    client = AsyncInferenceClient()

    # Text-to-image
    image = await client.text_to_image("An astronaut riding a horse")
    image.save("astronaut.png")

    # Streaming text
    async for token in await client.text_generation("The Hub is", stream=True):
        print(token, end="")

asyncio.run(main())
```

## Hackathon AI Patterns

### Todo Chatbot with AI

```python
from transformers import pipeline

# Load NLU pipeline
nlp = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

# Parse user intent
intent = nlp(
    "Add a task to buy groceries",
    candidate_labels=["add", "list", "complete", "delete", "update"]
)

# Extract task type
task_type = intent["labels"][0]  # "add"
confidence = intent["scores"][0]

# Extract entities
ner = pipeline("ner")
entities = ner("Remind me to call John tomorrow at 5pm")
```

### Task Action Router

```python
from huggingface_hub import InferenceClient

client = InferenceClient("meta-llama/Llama-3-8B-Instruct")

def route_action(user_input: str) -> dict:
    """Use LLM to understand and route user commands"""

    prompt = f"""
    You are a todo app assistant. Parse the user's command and return JSON.

    User: "{user_input}"

    Return JSON format:
    {{"action": "add|list|complete|delete", "task": "task name", "id": null}}

    JSON:
    """

    response = client.text_generation(prompt, max_tokens=100)
    return parse_json(response)
```

### Speech to Text for Tasks

```python
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC
import torch

# Load ASR model
processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-base-960h")
model = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-base-960h")

# Transcribe audio
def transcribe(audio_file):
    speech, rate = librosa.load(audio_file, sr=16000)
    inputs = processor(speech, sampling_rate=rate, return_tensors="pt")

    with torch.no_grad():
        logits = model(**inputs).logits

    predicted_ids = torch.argmax(logits, dim=-1)
    transcription = processor.batch_decode(predicted_ids)
    return transcription[0]
```

## Common Model IDs

| Task | Model ID |
|------|----------|
| Text Generation | `meta-llama/Meta-Llama-3-8B-Instruct` |
| Sentiment | `distilbert/distilbert-base-uncased-finetuned-sst-2-english` |
| QA | `distilbert/distilbert-base-cased-distilled-squad` |
| Summarization | `facebook/bart-large-cnn` |
| NER | `dbmdz/bert-large-cased-finetuned-conll03-english` |
| ASR | `facebook/wav2vec2-base-960h` |
| Text-to-Image | `stabilityai/stable-diffusion-2-1` |

## Best Practices

1. **Use pipelines** for quick inference and prototyping
2. **Use Auto classes** for model loading (handles architecture detection)
3. **Use batched=True** when processing datasets
4. **Use streaming** for long text generation
5. **Fine-tune on your data** for better accuracy
6. **Use InferenceClient** for serverless inference during development
7. **Use Inference Endpoints** for production deployments
