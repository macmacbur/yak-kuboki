import youtube_scraper

def main():
    print("Running REAL sampling to build database for QA...")
    # Override channels to just process 1 to get real data quickly without quota exhaustion
    youtube_scraper.CANALES_A_PROCESAR = [youtube_scraper.CANALES_A_PROCESAR[0]]
    
    conn = youtube_scraper.init_db()
    cursor = conn.cursor()
    youtube = youtube_scraper.build(youtube_scraper.YOUTUBE_API_SERVICE_NAME, youtube_scraper.YOUTUBE_API_VERSION, developerKey=youtube_scraper.API_KEY)
    
    for channel_id in youtube_scraper.CANALES_A_PROCESAR:
        videos = youtube_scraper.get_channel_videos(youtube, channel_id)
        # Limit to 15 videos to have a good sample for randomization
        videos = videos[:15]
        
        for idx, video in enumerate(videos):
            cursor.execute("SELECT video_id FROM videos WHERE video_id=?", (video['video_id'],))
            if cursor.fetchone():
                continue
                
            transcript = youtube_scraper.get_transcript(video['video_id'])
            comentario, sugerencia = youtube_scraper.generate_ai_comments(transcript, video['title'])
            
            cursor.execute('''
                INSERT INTO videos (video_id, channel_id, title, description, url, transcript, comentario_educativo, sugerencia_interaccion)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (video['video_id'], channel_id, video['title'], video['description'], video['url'], transcript, comentario, sugerencia))
            conn.commit()
            print(f"SAVED REAL VIDEO: {video['video_id']}")
            
    conn.close()
    print("REAL database created.")

if __name__ == '__main__':
    main()
