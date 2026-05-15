#!/usr/bin/env python3
"""Create MongoDB indexes for production."""
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'smartgiaoan')

async def create_indexes():
    client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    db = client[DB_NAME]
    
    # Users collection indexes
    await db.users.create_index([("email", 1)], unique=True)
    await db.users.create_index([("user_id", 1)], unique=True)
    await db.users.create_index([("paypal_subscription_id", 1)])
    
    # Worksheets collection indexes
    await db.worksheets.create_index([("user_id", 1)])
    await db.worksheets.create_index([("is_public", 1)])
    await db.worksheets.create_index([("level", 1)])
    await db.worksheets.create_index([("skill", 1)])
    await db.worksheets.create_index([("created_at", -1)])
    
    # User sessions collection indexes
    await db.user_sessions.create_index([("session_token", 1)], unique=True)
    await db.user_sessions.create_index([("user_id", 1)])
    await db.user_sessions.create_index([("expires_at", 1)])
    
    print("Indexes created successfully!")
    client.close()

if __name__ == "__main__":
    import asyncio
    asyncio.run(create_indexes())
