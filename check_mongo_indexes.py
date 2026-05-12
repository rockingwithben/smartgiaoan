import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json

MONGO_URL = os.environ.get('MONGO_URL', '')
DB_NAME = os.environ.get('DB_NAME', 'smartgiaoan')

async def get_indexes():
    if not MONGO_URL:
        print('MONGO_URL not set. Cannot connect to MongoDB.')
        return

    try:
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]

        users_indexes = await db.users.list_indexes().to_list(1000) # Added length argument
        worksheets_indexes = await db.worksheets.list_indexes().to_list(1000) # Added length argument

        print('Users indexes:')
        for index in users_indexes:
            print(f'  - {index}')
        print('\\nWorksheets indexes:')
        for index in worksheets_indexes:
            print(f'  - {index}')

        client.close()
    except Exception as e:
        print(f'Error connecting to MongoDB or retrieving indexes: {e}')

if __name__ == "__main__":
    asyncio.run(get_indexes())