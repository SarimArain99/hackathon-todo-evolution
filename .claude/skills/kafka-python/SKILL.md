# Kafka Python Skill

**Source**: Context7 MCP - `/dpkp/kafka-python`
**Benchmark Score**: 89.8 | **Code Snippets**: 144 | **Reputation**: High

## Overview

Python client for Apache Kafka, providing producers and consumers for event streaming.

## Key Concepts

### 1. Basic Producer

```python
from kafka import KafkaProducer

producer = KafkaProducer(bootstrap_servers='localhost:1234')

for _ in range(100):
    producer.send('foobar', b'some_message_bytes')
```

### 2. Producer with JSON Serialization

```python
from kafka import KafkaProducer
from kafka.errors import KafkaError
import json

producer = KafkaProducer(
    bootstrap_servers=['broker1:1234'],
    value_serializer=lambda m: json.dumps(m).encode('ascii')
)

# Asynchronous send
future = producer.send('my-topic', {'key': 'value'})

# Block for synchronous send
try:
    record_metadata = future.get(timeout=10)
    print(record_metadata.topic)
    print(record_metadata.partition)
    print(record_metadata.offset)
except KafkaError:
    pass

# Keyed messages for partitioning
producer.send('my-topic', key=b'foo', value=b'bar')

# Flush and close
producer.flush()
```

### 3. Producer with Callbacks

```python
def on_send_success(record_metadata):
    print(record_metadata.topic)
    print(record_metadata.partition)
    print(record_metadata.offset)

def on_send_error(excp):
    print('Error:', excp)

producer.send('my-topic', b'raw_bytes').add_callback(on_send_success).add_errback(on_send_error)
```

### 4. Basic Consumer

```python
from kafka import KafkaConsumer

consumer = KafkaConsumer('my_favorite_topic')
for msg in consumer:
    print(msg)
```

### 5. Consumer with Group

```python
from kafka import KafkaConsumer

consumer = KafkaConsumer(
    'my_favorite_topic',
    group_id='my_favorite_group'
)
for msg in consumer:
    print(msg)
```

### 6. Multi-threaded Producer-Consumer

```python
import threading
import time
import json
from kafka import KafkaProducer, KafkaConsumer, KafkaAdminClient
from kafka.admin import NewTopic
from kafka.errors import TopicAlreadyExistsError

class ProducerThread(threading.Thread):
    def __init__(self, topic, bootstrap_servers='localhost:9092'):
        threading.Thread.__init__(self)
        self.topic = topic
        self.stop_event = threading.Event()
        self.producer = KafkaProducer(
            bootstrap_servers=bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            acks='all',
            retries=3
        )

    def stop(self):
        self.stop_event.set()

    def run(self):
        counter = 0
        while not self.stop_event.is_set():
            message = {
                'id': counter,
                'timestamp': time.time(),
                'data': f'message-{counter}'
            }
            try:
                future = self.producer.send(self.topic, value=message)
                future.get(timeout=10)
                print(f'Produced: {message}')
                counter += 1
                time.sleep(1)
            except Exception as e:
                print(f'Producer error: {e}')
                break
        self.producer.flush()
        self.producer.close()

class ConsumerThread(threading.Thread):
    def __init__(self, topic, group_id, bootstrap_servers='localhost:9092'):
        threading.Thread.__init__(self)
        self.topic = topic
        self.stop_event = threading.Event()
        self.consumer = KafkaConsumer(
            topic,
            bootstrap_servers=bootstrap_servers,
            group_id=group_id,
            value_deserializer=lambda v: json.loads(v.decode('utf-8')),
            auto_offset_reset='earliest',
            enable_auto_commit=True,
            consumer_timeout_ms=1000
        )

    def stop(self):
        self.stop_event.set()

    def run(self):
        try:
            while not self.stop_event.is_set():
                for message in self.consumer:
                    print(f'Consumed: {message.value} '
                          f'from partition {message.partition} '
                          f'at offset {message.offset}')
                    if self.stop_event.is_set():
                        break
        finally:
            self.consumer.close()

# Create topic
admin = KafkaAdminClient(bootstrap_servers='localhost:9092')
topic = NewTopic(name='demo-topic', num_partitions=3, replication_factor=1)
try:
    admin.create_topics([topic])
except TopicAlreadyExistsError:
    pass
```

## Hackathon Kafka Topics

| Topic | Producer | Consumer | Purpose |
|-------|----------|----------|---------|
| task-events | Chat API | Recurring Task Service | All task CRUD |
| reminders | Chat API | Notification Service | Scheduled reminders |
| task-updates | Chat API | WebSocket Service | Real-time sync |

## Event Schema

```python
# Task Event
{
    "event_type": "created",  # created, updated, completed, deleted
    "task_id": 1,
    "task_data": {...},
    "user_id": "user123",
    "timestamp": "2025-01-01T00:00:00Z"
}

# Reminder Event
{
    "task_id": 1,
    "title": "Buy groceries",
    "due_at": "2025-01-02T10:00:00Z",
    "remind_at": "2025-01-02T09:00:00Z",
    "user_id": "user123"
}
```

## Redpanda Cloud Connection

```python
from kafka import KafkaProducer
import json

producer = KafkaProducer(
    bootstrap_servers="YOUR-CLUSTER.cloud.redpanda.com:9092",
    security_protocol="SASL_SSL",
    sasl_mechanism="SCRAM-SHA-256",
    sasl_plain_username="YOUR-USERNAME",
    sasl_plain_password="YOUR-PASSWORD",
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

producer.send("task-events", {"event_type": "created", "task_id": 1})
```
