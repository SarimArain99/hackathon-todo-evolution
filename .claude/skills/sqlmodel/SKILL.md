# SQLModel Skill

**Source**: Context7 MCP - `/websites/sqlmodel_tiangolo`
**Benchmark Score**: 78.2 | **Code Snippets**: 2464 | **Reputation**: High

## Overview

SQLModel is a library for interacting with SQL databases, combining SQLAlchemy and Pydantic, designed for defining models and integrating well with FastAPI.

## Key Concepts

### 1. Define Models and Database Setup

```python
from sqlmodel import Field, Session, SQLModel, create_engine

class Team(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    headquarters: str

class Hero(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    secret_name: str
    age: int | None = Field(default=None, index=True)
    team_id: int | None = Field(default=None, foreign_key="team.id")

sqlite_url = "sqlite:///database.db"
engine = create_engine(sqlite_url, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
```

### 2. Relationships

```python
from sqlmodel import Field, Relationship, SQLModel

class Team(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    headquarters: str
    heroes: list["Hero"] = Relationship(back_populates="team")

class Hero(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    secret_name: str
    age: int | None = Field(default=None, index=True)
    team_id: int | None = Field(default=None, foreign_key="team.id")
    team: Team | None = Relationship(back_populates="heroes")
```

### 3. CRUD Operations

```python
from sqlmodel import Session, select

# CREATE
def create_heroes():
    with Session(engine) as session:
        team = Team(name="Preventers", headquarters="Sharp Tower")
        hero = Hero(name="Deadpond", secret_name="Dive Wilson", team=team)
        session.add(hero)
        session.commit()
        session.refresh(hero)
        print("Created hero:", hero)

# READ
def select_heroes():
    with Session(engine) as session:
        statement = select(Hero).where(Hero.name == "Spider-Boy")
        result = session.exec(statement)
        hero = result.one()
        print("Hero:", hero)

# UPDATE
def update_heroes():
    with Session(engine) as session:
        statement = select(Hero).where(Hero.name == "Spider-Boy")
        hero = session.exec(statement).one()
        hero.team = None
        session.add(hero)
        session.commit()

# DELETE
def delete_heroes():
    with Session(engine) as session:
        statement = select(Hero).where(Hero.name == "Spider-Boy")
        hero = session.exec(statement).one()
        session.delete(hero)
        session.commit()
```

### 4. Querying with Relationships

```python
from sqlmodel import Session, select

def select_heroes_with_teams():
    with Session(engine) as session:
        statement = select(Team).where(Team.name == "Preventers")
        team = session.exec(statement).one()
        print("Team heroes:", team.heroes)
```

## Hackathon Task Model

```python
from sqlmodel import Field, SQLModel
from datetime import datetime

class Task(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    title: str
    description: str | None = None
    completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

## Database Connection (Neon PostgreSQL)

```python
import os
from sqlmodel import create_engine

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, echo=True)
```
