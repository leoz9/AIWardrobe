
import asyncio
import aiosqlite
from pathlib import Path

DB_PATH = Path("wardrobe.db")

async def check_db():
    print(f"Checking DB at {DB_PATH.absolute()}")
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            cursor = await db.execute("SELECT count(*) FROM clothes")
            row = await cursor.fetchone()
            print(f"Number of clothes: {row[0]}")
            
            cursor = await db.execute("SELECT * FROM clothes LIMIT 1")
            row = await cursor.fetchone()
            if row:
                print("First item:", row)
            else:
                print("No items found.")
    except Exception as e:
        print(f"Error accessing DB: {e}")

if __name__ == "__main__":
    asyncio.run(check_db())
