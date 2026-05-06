import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

def send_daily_report(videos_count, new_videos, db_status):
    sender_email = os.environ.get('EMAIL_USER', 'tu_correo@gmail.com')
    sender_password = os.environ.get('EMAIL_PASS', 'tu_contraseña_de_aplicacion')
    receiver_email = "mburcet@yahoo.com.ar"
    
    subject = "Reporte Diario - Ecosistema Educativo IA"
    
    body = f"""Hola,
    
Este es el reporte diario automático de la sincronización de videos del Tutor IA Kuboki.

ESTADÍSTICAS DEL DÍA:
- Nuevos videos procesados e ingresados a la IA: {videos_count}
- Títulos nuevos destacados: 
{chr(10).join(['  - ' + v for v in new_videos[:5]])}

ESTADO DE SALUD DE LA BASE DE DATOS:
{db_status}

El Árbol Mágico ya está utilizando este nuevo conocimiento en sus interacciones con los niños.

Saludos,
Tu Ingeniero de IA Senior
"""

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain', 'utf-8'))
    
    if sender_password == 'tu_contraseña_de_aplicacion':
        print("\n[AVISO DE SIMULACIÓN] El correo está configurado, pero faltan tus credenciales reales.")
        print(f"Destinatario: {receiver_email}")
        print(f"Asunto: {subject}")
        print("Contenido del correo simulado:")
        print("-------------------------------")
        print(body)
        print("-------------------------------")
        print("Para enviar un correo real, debes configurar las variables de entorno EMAIL_USER y EMAIL_PASS con tu cuenta de Gmail (y una contraseña de aplicación).")
        return False
        
    try:
        # Configuración para Gmail (ajustar si se usa otro proveedor)
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        text = msg.as_string()
        server.sendmail(sender_email, receiver_email, text)
        server.quit()
        print(f"✅ Email enviado exitosamente a {receiver_email}")
        return True
    except Exception as e:
        print(f"❌ Error al enviar el correo: {e}")
        return False

if __name__ == '__main__':
    # Prueba manual
    send_daily_report(15, ["Panda Video 1", "El León Mágico"], "Operativa: 100% Sin Errores")
