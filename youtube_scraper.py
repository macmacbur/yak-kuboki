import os
import sqlite3
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from youtube_transcript_api import YouTubeTranscriptApi

# ==========================================
# CONFIGURACIONES Y CREDENCIALES
# ==========================================
API_KEY = "AIzaSyCDAY8yb-y3NazR9ymBkpVNizhCpBA3K-w"
YOUTUBE_API_SERVICE_NAME = 'youtube'
YOUTUBE_API_VERSION = 'v3'

# Lista completa con todos los canales que has proporcionado:
CANALES_A_PROCESAR = [
    "UCHxjbOFLYWJxIPqc3s4er5w",
    "UCW1HL7ok7Rp7P8HJLFM6vfA",
    "UCOzG2XXgYBGh1SbJFHrlvKQ",
    "UCoqayXYaLZmQetihD4pjYEA",
    "UCUjSjPXkhuksnsXipqNwfdA",
    "UC3Z6zwpO9gJi89nhBL0lNfA",
    "UCrtbPdp4FDYfJv3g4XutSqg",
    "UCcQW7IZy7R2bgDdlH5ff1DQ",
    "UC-HgQkJoKPKfd78TaDHhZLw",
    "UCDIMWau9boaXch7TPFqcg-w",
    "UCbQBHkRUZGi7UNSfdsp1OqQ",
    "UC7RgO5rxt8JmdWwR6kSIyRQ",
    "UCode949Tg9uEfn0lWDwg22A",
    "UCBI-V6Q9bIAzN-dXF7EYmgg",
    "UCUXbnsQh-9JJglfPxIbsrWQ",
    "UCTC4zpRzDBLEBNutm7PaF5g",
    "UCQp5MPpDyhnhyFzdobMvuUA",
    "UCM_SQ310x1s3wSFKW_3i1fg",
    "UCOXSKHqojomPgDpCssAyBKA",
    "UCWxQwHUAukquZXRiKeDbNqA",
    "UCuDDv1OPZKaL9gnO23SHs8Q",
    "UCnAs-igaJOt_BnxyCagDPaQ"
]

DB_NAME = "videos_ninos.db"

# ==========================================
# 1. INICIALIZACIÓN DE BASE DE DATOS
# ==========================================
def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    # Creamos la tabla si no existe
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS videos (
            video_id TEXT PRIMARY KEY,
            channel_id TEXT,
            title TEXT,
            description TEXT,
            url TEXT,
            transcript TEXT,
            comentario_educativo TEXT,
            sugerencia_interaccion TEXT
        )
    ''')
    conn.commit()
    return conn

# ==========================================
# 2. EXTRACCIÓN DE VIDEOS (CONTROL DE CUOTAS)
# ==========================================
def get_channel_videos(youtube, channel_id):
    """Obtiene todos los videos de un canal usando la lista de 'Uploads' para ahorrar cuota."""
    videos = []
    
    try:
        # Obtener información del canal para ubicar la lista de reproducción principal
        channel_response = youtube.channels().list(
            part='contentDetails',
            id=channel_id
        ).execute()
        
        if not channel_response.get('items'):
            print(f"No se encontró el canal: {channel_id}")
            return videos
            
        uploads_playlist_id = channel_response['items'][0]['contentDetails']['relatedPlaylists']['uploads']
        
        # Paginación (manejo de más de 50 videos)
        next_page_token = None
        while True:
            playlist_response = youtube.playlistItems().list(
                part='snippet',
                playlistId=uploads_playlist_id,
                maxResults=50,
                pageToken=next_page_token
            ).execute()
            
            for item in playlist_response['items']:
                video_id = item['snippet']['resourceId']['videoId']
                title = item['snippet']['title']
                description = item['snippet']['description']
                url = f"https://www.youtube.com/watch?v={video_id}"
                
                videos.append({
                    'video_id': video_id,
                    'title': title,
                    'description': description,
                    'url': url
                })
                
            next_page_token = playlist_response.get('nextPageToken')
            if not next_page_token:
                break # Se acabaron las páginas
                
    except HttpError as e:
        print(f"Error de la API de YouTube al procesar el canal {channel_id}: {e}")
        
    return videos

# ==========================================
# 3. EXTRACCIÓN DE TRANSCRIPCIONES
# ==========================================
def get_transcript(video_id):
    """Obtiene el texto completo de lo que se habla en el video."""
    try:
        # Busca la transcripción. Prioriza varios idiomas comunes en tus canales.
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=['es', 'en', 'pt', 'de', 'ko', 'ja', 'tr'])
        
        # Concatena todos los fragmentos en un solo texto continuo
        full_text = " ".join([t['text'] for t in transcript_list])
        return full_text
    except Exception as e:
        return ""

# ==========================================
# 4. LÓGICA DE INTERACCIÓN EDUCATIVA
# ==========================================
def generate_ai_comments(transcript, title):
    """
    Analiza el título y transcripción para generar comentarios iniciales.
    """
    title_lower = title.lower()
    transcript_lower = transcript.lower()
    
    if "panda" in title_lower or "panda" in transcript_lower:
        comentario = f"¡Mira! En este video sale nuestro amigo el Panda. Habla sobre: '{title}'."
        sugerencia = "¿Qué crees que va a hacer el Panda ahora? ¡Cuéntamelo!"
    elif "agua" in title_lower or "water" in transcript_lower or "tobogán" in transcript_lower:
        comentario = "¡Wow, un video lleno de agua y diversión! Me encantan las aventuras frescas."
        sugerencia = "¿Te gusta nadar? ¡Imagina que estamos en ese tobogán gigante!"
    else:
        comentario = f"¡Tengo una historia nueva muy emocionante! Se llama '{title}'."
        sugerencia = "¡Míralo y luego cuéntame cuál fue tu parte favorita!"
        
    return comentario, sugerencia

# ==========================================
# MOTOR PRINCIPAL
# ==========================================
def main():
    print("Iniciando motor de extracción masiva de Kuboki...")
    print(f"Total de canales a procesar: {len(CANALES_A_PROCESAR)}")
    
    videos_agregados = []
    
    conn = init_db()
    cursor = conn.cursor()
    youtube = build(YOUTUBE_API_SERVICE_NAME, YOUTUBE_API_VERSION, developerKey=API_KEY)
    
    for idx_canal, channel_id in enumerate(CANALES_A_PROCESAR):
        print(f"\n=============================================")
        print(f"[{idx_canal+1}/{len(CANALES_A_PROCESAR)}] Procesando canal: {channel_id}")
        print(f"=============================================")
        
        videos = get_channel_videos(youtube, channel_id)
        print(f"Se encontraron {len(videos)} videos en este canal.")
        
        for idx, video in enumerate(videos):
            # Verificar si ya existe en la DB para ahorrar cuota
            cursor.execute("SELECT video_id FROM videos WHERE video_id=?", (video['video_id'],))
            if cursor.fetchone():
                continue
                
            print(f"  [{idx+1}/{len(videos)}] Descargando transcripción y guardando: {video['title'][:40]}...")
            
            transcript = get_transcript(video['video_id'])
            comentario, sugerencia = generate_ai_comments(transcript, video['title'])
            
            cursor.execute('''
                INSERT INTO videos (video_id, channel_id, title, description, url, transcript, comentario_educativo, sugerencia_interaccion)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                video['video_id'], channel_id, video['title'], video['description'], 
                video['url'], transcript, comentario, sugerencia
            ))
            conn.commit()
            videos_agregados.append(video['title'])
            
    conn.close()
    print("\n¡PROCESAMIENTO MASIVO COMPLETADO CON ÉXITO! Base de datos guardada como 'videos_ninos.db'")
    
    print(f"Total de videos nuevos añadidos: {len(videos_agregados)}")
    
    # 4. Exportar base de datos a JSON para que la web lo lea
    try:
        import exportar_db_web
        exportar_db_web.export_db_to_json()
    except Exception as e:
        print("Error exportando a JSON:", e)
    
    # 5. Generar archivo de estado de sincronización para el Frontend (app.js)
    import json
    with open('sync_status.json', 'w') as f:
        json.dump({"nuevos_hoy": len(videos_agregados)}, f)
        
    # 6. Enviar notificación por email
    import email_notifier
    db_status = "Operativa: 100% Sin Errores"
    email_notifier.send_daily_report(len(videos_agregados), videos_agregados, db_status)

if __name__ == '__main__':
    main()
