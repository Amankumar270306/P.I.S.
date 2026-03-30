import os
from sqlalchemy import text
from app.db.session import engine

def init_db():
    schema_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'db', 'schema.sql')
    
    with open(schema_path, 'r') as f:
        schema_sql = f.read()
        
    with engine.connect() as conn:
        with conn.begin():
            # Executing the raw SQL schema which includes cascades and drop tables if we add them,
            # or simply run it directly on the empty database.
            # To make it robust, we should drop cascade all tables first if they exist.
            conn.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public;"))
            conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
            conn.execute(text(schema_sql))
            
    print("Database has been fully initialized with the normalized schema.")

if __name__ == "__main__":
    init_db()
