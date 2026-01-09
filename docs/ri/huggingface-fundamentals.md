# Hugging Face Fundamentals - Reference Information

**Source**: Context7 - /huggingface/huggingface_hub, /huggingface/datasets, /websites/huggingface_co_transformers
**Date**: 2026-01-09
**Purpose**: Quick reference for Hugging Face ecosystem

---

## Hugging Face Hub Overview

The Hugging Face Hub is a platform for sharing machine learning models, datasets, demos, and metrics. It provides:

- **Pre-trained Models**: Thousands of models for NLP, vision, and audio tasks
- **Datasets**: Largest hub of ready-to-use datasets
- **Spaces**: Hosted ML demos and applications
- **Libraries**: `transformers`, `datasets`, `huggingface_hub`, `tokenizers`

---

## Installation

```bash
# Core libraries
pip install transformers
pip install datasets
pip install huggingface_hub

# With extras
pip install transformers[torch]        # PyTorch
pip install transformers[tensorflow]   # TensorFlow
pip install huggingface_hub[inference] # Inference client
```

---

## Loading Models

### Using Auto Classes

```python
from transformers import AutoModel, AutoTokenizer, AutoModelForSequenceClassification

# Load model
model = AutoModel.from_pretrained("bert-base-uncased")

# Load with specific task
model = AutoModelForSequenceClassification.from_pretrained("distilbert/distilbert-base-cased-distilled-squad")

# Load tokenizer
tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")

# Load both
from transformers import pipeline
classifier = pipeline("sentiment-analysis")
```

### From Hub

```python
from transformers import AutoModel

# Load from Hub
model = AutoModel.from_pretrained("my-username/my-model")

# Load with authentication
model = AutoModel.from_pretrained("private-model", token="hf_your_token")
```

---

## Pipelines

Pipelines provide a simple API for common ML tasks:

```python
from transformers import pipeline

# Text Classification
classifier = pipeline("sentiment-analysis")
result = classifier("I love Docker and Hugging Face!")

# Question Answering
qa = pipeline("question-answering", model="distilbert/distilbert-base-cased-distilled-squad")
result = qa(question="What is Docker?", context="Docker is a containerization platform...")

# Named Entity Recognition
ner = pipeline("ner", model="dbmdz/bert-large-cased-finetuned-conll03-english")
result = ner("Hugging Face is based in New York.")

# Summarization
summarizer = pipeline("summarization")
result = summarizer("Long text to summarize...")

# Translation
translator = pipeline("translation", model="t5-base")
result = translator("Translate this text.")

# Text Generation
generator = pipeline("text-generation")
result = generator("Once upon a time...")

# Zero-Shot Classification
classifier = pipeline("zero-shot-classification")
result = classifier("Docker is great!", candidate_labels=["technology", "cooking", "sports"])

# Image Classification
classifier = pipeline("image-classification")
result = classifier("path/to/image.jpg")

# Automatic Speech Recognition
asr = pipeline("automatic-speech-recognition")
result = asr("audio.wav")
```

---

## Datasets Library

### Loading Datasets

```python
from datasets import load_dataset

# Load complete dataset
dataset = load_dataset('cornell-movie-review-data/rotten_tomatoes')

# Load specific split
train_data = load_dataset('cornell-movie-review-data/rotten_tomatoes', split='train')

# Load with configuration
dataset = load_dataset('nyu-mll/glue', 'sst2', split='train')

# Load multiple splits
dataset = load_dataset('rajpurkar/squad', split=['train', 'validation'])

# List all datasets
from huggingface_hub import list_datasets
print([dataset.id for dataset in list_datasets()])
```

### Processing Datasets

```python
from datasets import load_dataset
from transformers import AutoTokenizer

# Load dataset
squad_dataset = load_dataset('rajpurkar/squad')

# Add column with processing
dataset_with_length = squad_dataset.map(lambda x: {"length": len(x["context"])})

# Tokenize (batched for efficiency)
tokenizer = AutoTokenizer.from_pretrained('bert-base-cased')
tokenized_dataset = squad_dataset.map(
    lambda x: tokenizer(x['context']),
    batched=True
)

# Cast column type
from datasets import Image
dataset = load_dataset("AI-Lab-Makerere/beans", split="train")
dataset = dataset.cast_column("image", Image(mode="RGB"))

# Audio datasets
from datasets import load_dataset, Audio
dataset = load_dataset("PolyAI/minds14", "en-US", split="train")
```

---

## Inference API

### InferenceClient

```python
from huggingface_hub import InferenceClient

# Initialize client
client = InferenceClient(
    model="meta-llama/Meta-Llama-3-8B-Instruct",
    token="hf_your_token_here"  # Optional
)

# Text Generation
response = client.text_generation("The future of AI is", max_tokens=100)
print(response)

# Chat Completion
messages = [
    {"role": "user", "content": "What is the capital of France?"}
]
response = client.chat_completion(
    messages=messages,
    max_tokens=100,
    temperature=0.7
)
print(response.choices[0].message.content)

# Streaming
stream = client.chat_completion(messages=messages, stream=True, max_tokens=500)
for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")

# Image Classification
result = client.image_classification("https://example.com/image.jpg")

# Text-to-Image
image = client.text_to_image("a beautiful sunset over mountains")
image.save("sunset.png")

# Feature Extraction (Embeddings)
embeddings = client.feature_extraction("Hello, world!")
```

### Async Inference

```python
from huggingface_hub import AsyncInferenceClient
import asyncio

async def main():
    client = AsyncInferenceClient()

    # Text-to-image
    image = await client.text_to_image("An astronaut riding a horse on the moon.")
    image.save("astronaut.png")

    # Streaming text generation
    async for token in await client.text_generation("The Hub is", stream=True):
        print(token, end="")

asyncio.run(main())
```

---

## Training with Trainer API

### Basic Training Setup

```python
from transformers import (
    Trainer,
    TrainingArguments,
    AutoModelForSequenceClassification,
    AutoTokenizer
)

# Load model and tokenizer
model = AutoModelForSequenceClassification.from_pretrained("bert-base-uncased")
tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")

# Define training arguments
training_args = TrainingArguments(
    output_dir="./results",
    learning_rate=2e-5,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=16,
    num_train_epochs=3,
    weight_decay=0.01,
    eval_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    push_to_hub=True,
)

# Initialize trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset["train"],
    eval_dataset=tokenized_dataset["test"],
    processing_class=tokenizer,
    compute_metrics=compute_metrics_fn,
)

# Train
trainer.train()

# Save
trainer.save_model("./my-model")
```

### TrainingArguments Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `output_dir` | Output directory | Required |
| `learning_rate` | Initial learning rate | 5e-5 |
| `per_device_train_batch_size` | Batch size per device | 8 |
| `num_train_epochs` | Number of epochs | 3 |
| `weight_decay` | Weight decay | 0 |
| `eval_strategy` | Evaluation strategy ("steps", "epoch") | "no" |
| `save_strategy` | Save strategy | "steps" |
| `load_best_model_at_end` | Load best model at end | False |
| `push_to_hub` | Push to Hub | False |

---

## Model Tasks Supported

### Text Tasks
- **Classification**: Sentiment analysis, topic classification
- **Information Extraction**: NER, POS tagging
- **Question Answering**: Extractive, generative
- **Summarization**: Abstractive, extractive
- **Translation**: Seq2Seq models
- **Generation**: Text generation, completion

### Vision Tasks
- **Image Classification**: Categorize images
- **Object Detection**: Detect objects
- **Segmentation**: Image segmentation

### Audio Tasks
- **Speech Recognition**: ASR
- **Audio Classification**: Classify audio
- **Text-to-Speech**: TTS

---

## Quick Examples

### Speech-to-Text Pipeline

```python
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC
from datasets import load_dataset
import torch

# Load model
processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-base-960h")
model = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-base-960h")

# Load audio
dataset = load_dataset("hf-internal-testing/librispeech_asr_demo", "clean", split="validation")

# Process and infer
inputs = processor(dataset[0]["audio"]["array"], sampling_rate=16000, return_tensors="pt")
with torch.no_grad():
    logits = model(**inputs).logits
predicted_ids = torch.argmax(logits, dim=-1)

# Decode
transcription = processor.batch_decode(predicted_ids)
print(transcription[0])
```

### Fine-tuning Example

```python
from transformers import AutoModelForSequenceClassification, Trainer, TrainingArguments

# Load pre-trained model
model = AutoModelForSequenceClassification.from_pretrained(
    "bert-base-uncased",
    num_labels=2
)

# Setup training
training_args = TrainingArguments(
    output_dir="./sentiment-model",
    learning_rate=2e-5,
    per_device_train_batch_size=16,
    num_train_epochs=2,
    eval_strategy="epoch",
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_datasets["train"],
    eval_dataset=tokenized_datasets["test"],
)

# Fine-tune
trainer.train()

# Push to Hub
trainer.push_to_hub("my-sentiment-model")
```

---

## Inference Endpoints API

### Managing Endpoints

```python
from huggingface_hub import InferenceClient

# Create endpoint (via API)
# POST /api/inference-endpoints
{
    "repository": "username/model-name",
    "instance_type": "small",
    "instance_count": 1
}

# Use endpoint
client = InferenceClient(
    model="https://my-endpoint.endpoints.huggingface.cloud",
    token="hf_token"
)
```

---

## Common Model IDs

| Task | Model ID |
|------|----------|
| Text Generation | `meta-llama/Meta-Llama-3-8B-Instruct` |
| Sentiment Analysis | `distilbert/distilbert-base-uncased-finetuned-sst-2-english` |
| Question Answering | `distilbert/distilbert-base-cased-distilled-squad` |
| Summarization | `facebook/bart-large-cnn` |
| Translation | `t5-base` |
| Named Entity Recognition | `dbmdz/bert-large-cased-finetuned-conll03-english` |
| Image Classification | `google/vit-base-patch16-224` |
| ASR | `facebook/wav2vec2-base-960h` |
| Text-to-Image | `stabilityai/stable-diffusion-2-1` |
