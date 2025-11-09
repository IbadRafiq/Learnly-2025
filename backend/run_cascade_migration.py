"""
Script to add CASCADE DELETE to foreign keys in the database
Run this script to fix the foreign key constraints
"""
import psycopg2
from app.core.config import settings

def run_migration():
    """Run the cascade delete migration"""
    try:
        # Read the SQL file
        with open('fix_cascade_delete.sql', 'r') as f:
            sql_script = f.read()
        
        # Connect to database
        conn = psycopg2.connect(settings.DATABASE_URL)
        cursor = conn.cursor()
        
        print("Running cascade delete migration...")
        
        # Execute the SQL script
        cursor.execute(sql_script)
        conn.commit()
        
        print("✅ Migration completed successfully!")
        print("Foreign keys now have CASCADE DELETE enabled.")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    run_migration()
