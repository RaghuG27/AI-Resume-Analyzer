from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT
            current_database(),
            current_schema(),
            current_user,
            inet_server_addr(),
            inet_server_port()
    """))

    print("Database connection details:")
    print(result.fetchone())

    tables = conn.execute(text("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
    """))

    print("Tables:")
    for row in tables:
        print(row[0])