# FastAPI Skill

**Source**: Context7 MCP - `/fastapi/fastapi`
**Benchmark Score**: 87.2 | **Code Snippets**: 881 | **Reputation**: High

## Overview

FastAPI is a modern, fast (high-performance) web framework for building APIs with Python 3.7+ based on standard Python type hints.

## Key Concepts

### 1. Basic Application Setup

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}
```

### 2. Pydantic Models for Request/Response Validation

```python
from typing import Union
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    description: Union[str, None] = None
    price: float
    tax: Union[float, None] = None

@app.post("/items/")
async def create_item(item: Item):
    item_dict = item.dict()
    if item.tax:
        price_with_tax = item.price + item.tax
        item_dict["price_with_tax"] = price_with_tax
    return item_dict

@app.put("/items/{item_id}")
def update_item(item_id: int, item: Item):
    return {"item_name": item.name, "item_id": item_id}
```

### 3. Dependency Injection

```python
from typing import Annotated, Union
from fastapi import Depends, FastAPI, HTTPException

app = FastAPI()

async def common_parameters(
    q: Union[str, None] = None,
    skip: int = 0,
    limit: int = 100
):
    return {"q": q, "skip": skip, "limit": limit}

@app.get("/items/")
async def read_items(commons: Annotated[dict, Depends(common_parameters)]):
    return {"params": commons, "items": ["item1", "item2"]}

# Database dependency with cleanup
async def get_db():
    db = {"connection": "active"}
    try:
        yield db
    finally:
        db["connection"] = "closed"

@app.get("/query/")
async def query_data(db: Annotated[dict, Depends(get_db)]):
    return {"database": db, "data": "query results"}
```

### 4. CORS Middleware

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://example.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
```

### 5. Exception Handling

```python
from fastapi import Depends, FastAPI, HTTPException

@app.get("/items/{item_id}")
def get_item(item_id: str):
    if item_id not in data:
        raise HTTPException(status_code=404, detail="Item not found")
    return data[item_id]
```

## Hackathon API Pattern

```python
# Todo API endpoints
@app.get("/api/{user_id}/tasks")
async def list_tasks(user_id: str): pass

@app.post("/api/{user_id}/tasks")
async def create_task(user_id: str, task: TaskCreate): pass

@app.put("/api/{user_id}/tasks/{task_id}")
async def update_task(user_id: str, task_id: int): pass

@app.delete("/api/{user_id}/tasks/{task_id}")
async def delete_task(user_id: str, task_id: int): pass

@app.patch("/api/{user_id}/tasks/{task_id}/complete")
async def toggle_complete(user_id: str, task_id: int): pass
```

## Running

```bash
uvicorn main:app --reload --port 8000
```
