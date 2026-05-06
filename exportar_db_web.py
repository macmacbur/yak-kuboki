import sqlite3
import json

def export_db_to_json():
    print("Exporting SQLite database to JSON for frontend...")
    conn = sqlite3.connect('videos_ninos.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT video_id, channel_id, title, description, transcript, comentario_educativo, sugerencia_interaccion FROM videos")
    rows = cursor.fetchall()
    
    videos = []
    for row in rows:
        video = {
            "id": row[0],
            "channel_id": row[1],
            "title": row[2],
            "description": row[3],
            "transcript": row[4],
            "ai_comment": row[5],
            "ai_suggestion": row[6]
        }
        videos.append(video)
        
    with open('videos_catalogo.json', 'w', encoding='utf-8') as f:
        json.dump(videos, f, ensure_ascii=False, indent=4)
        
    conn.close()
    print(f"Successfully exported {len(videos)} videos to videos_catalogo.json")

if __name__ == '__main__':
    export_db_to_json()
