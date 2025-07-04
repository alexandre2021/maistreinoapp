import os
import json
import io
import requests
from PIL import Image
from googleapiclient.discovery import build
from google.oauth2.service_account import Credentials
from supabase import create_client, Client
import tempfile
import uuid
import unicodedata

# Configurações
GOOGLE_DRIVE_FOLDER_ID = "15XQpNxzHAoAJHBy3HYE5ivUy5RxaCRVz"
BUCKET_NAME = "exercicios-padrao"
CREDENTIALS_PATH = "google-service-account.json"

# Supabase - TEMPORARIAMENTE use a anon key, mas se der erro de RLS, troque pela service_role
SUPABASE_URL = "https://prvfvlyzfyprjliqniki.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBydmZ2bHl6ZnlwcmpsaXFuaWtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNjk5MjUsImV4cCI6MjA2NDY0NTkyNX0.R3TRC1-FOlEuihuIW7oDTNGYYalpzC4v7qn46wOa1dw"

# Se der erro de RLS no storage, descomente a linha abaixo e comente a de cima:
# SUPABASE_KEY = "SUA_SERVICE_ROLE_KEY_AQUI"

def remove_accents(text):
    """Remove acentos e caracteres especiais para paths válidos"""
    nfd = unicodedata.normalize('NFD', text)
    without_accents = ''.join(char for char in nfd if unicodedata.category(char) != 'Mn')
    clean_path = without_accents.lower().replace(' ', '-')
    return clean_path

def detect_equipment(exercise_name):
    """Detecta equipamento baseado no nome do exercício"""
    name_lower = exercise_name.lower()
    
    # Halteres/Dumbbells
    if any(word in name_lower for word in [
        'dumbbell', 'halter', 'db-', 'dumbell', 'haltere'
    ]):
        return "Halteres"
    
    # Barras/Barbells  
    if any(word in name_lower for word in [
        'barbell', 'barra', 'bb-', 'bar-', 'olympic'
    ]):
        return "Barra"
    
    # Cabos/Máquinas
    if any(word in name_lower for word in [
        'cable', 'cabo', 'machine', 'maquina', 'pulley', 
        'lat-pulldown', 'seated', 'leg-press', 'smith'
    ]):
        return "Cabo/Máquina"
    
    # Kettlebell
    if any(word in name_lower for word in [
        'kettlebell', 'kettle', 'kb-'
    ]):
        return "Kettlebell"
    
    # Elásticos/Bandas
    if any(word in name_lower for word in [
        'band', 'elastic', 'resistance', 'elastico'
    ]):
        return "Elástico"
    
    # TRX/Suspensão
    if any(word in name_lower for word in [
        'trx', 'suspension', 'suspensao', 'strap'
    ]):
        return "TRX"
    
    # Peso corporal (exercícios específicos)
    if any(word in name_lower for word in [
        'push-up', 'pull-up', 'flexao', 'dip', 'plank', 
        'burpee', 'mountain', 'jump', 'squat', 'lunge',
        'crunch', 'sit-up', 'leg-raise', 'bodyweight'
    ]):
        return "Peso Corporal"
    
    return "Peso Corporal"  # fallback

def detect_difficulty(exercise_name):
    """Detecta dificuldade baseada no nome do exercício"""
    name_lower = exercise_name.lower()
    
    # ALTA - Movimentos muito complexos ou unilaterais
    if any(word in name_lower for word in [
        'one-arm', 'single-arm', 'unilateral', 'pistol', 
        'archer', 'human-flag', 'muscle-up', 'handstand',
        'one-leg', 'single-leg', 'advanced', 'explosive',
        'plyometric', 'jump', 'clapping'
    ]):
        return "Alta"
    
    # BAIXA - Exercícios assistidos, na máquina ou básicos
    if any(word in name_lower for word in [
        'assisted', 'machine', 'seated', 'supported',
        'incline', 'wall', 'knee', 'modified',
        'beginner', 'easy', 'basic'
    ]):
        return "Baixa"
    
    # MÉDIA - Padrão para maioria dos exercícios
    return "Média"

def generate_description(muscle_group):
    """Gera descrição baseada no grupo muscular"""
    descriptions = {
        'Tríceps': 'Exercício para desenvolvimento e fortalecimento da porção posterior do braço',
        'Ombros': 'Exercício para desenvolvimento dos deltoides e estabilização dos ombros',
        'Panturrilha': 'Exercício para fortalecimento e desenvolvimento da musculatura da panturrilha',
        'Trapézio': 'Exercício para fortalecimento do trapézio e região cervical',
        'Costas': 'Exercício para fortalecimento dos músculos das costas e melhora da postura',
        'Peito': 'Exercício para desenvolvimento do peitoral maior e menor',
        'Bíceps': 'Exercício para fortalecimento e hipertrofia do bíceps braquial',
        'Glúteos': 'Exercício para ativação e fortalecimento dos músculos glúteos',
        'Abdômen': 'Exercício para fortalecimento do core e músculos abdominais',
        'Pernas': 'Exercício para fortalecimento dos músculos das pernas e quadril'
    }
    return descriptions.get(muscle_group, 'Exercício de fortalecimento muscular')

def generate_instructions(slug, muscle_group):
    """Gera instruções específicas baseadas no exercício"""
    if 'agachamento' in slug or 'squat' in slug:
        return "1. Posicione os pés na largura dos ombros\n2. Mantenha o peito erguido e core ativado\n3. Desça flexionando quadril e joelhos até 90 graus\n4. Suba empurrando o chão com os pés\n5. Mantenha os joelhos alinhados com os pés"
    elif 'supino' in slug or 'press' in slug:
        return "1. Deite no banco com os pés firmes no chão\n2. Segure o peso com pegada adequada\n3. Mantenha ombros retraídos e core contraído\n4. Desça controladamente até o peito\n5. Empurre o peso para cima mantendo controle"
    elif 'rosca' in slug or 'curl' in slug:
        return "1. Mantenha os cotovelos fixos ao lado do corpo\n2. Segure o peso com pegada firme\n3. Contraia o bíceps para flexionar o braço\n4. Suba até a contração máxima\n5. Desça controladamente sem balançar"
    elif 'triceps' in slug or 'extensao-triceps' in slug or 'testa-francesa' in slug:
        return "1. Mantenha os cotovelos fixos e estáveis\n2. Estenda completamente os braços\n3. Contraia o tríceps na extensão\n4. Retorne controladamente à posição inicial\n5. Não mova os ombros durante o movimento"
    elif 'elevacao' in slug or 'raise' in slug:
        return "1. Mantenha postura ereta e core ativado\n2. Eleve o peso ou corpo controladamente\n3. Pause brevemente no topo do movimento\n4. Desça controladamente\n5. Não use impulso ou balanço"
    elif 'remada' in slug or 'row' in slug:
        return "1. Mantenha as costas retas e peito para fora\n2. Puxe os cotovelos para trás\n3. Aperte as escápulas no final do movimento\n4. Retorne controladamente à posição inicial\n5. Mantenha o core contraído durante todo exercício"
    elif 'flexao' in slug or 'push-up' in slug:
        return "1. Posicione as mãos na largura dos ombros\n2. Mantenha o corpo alinhado da cabeça aos pés\n3. Desça até o peito quase tocar o chão\n4. Empurre com força para subir\n5. Mantenha o core contraído sem deixar quadril cair"
    elif 'desenvolvimento' in slug or 'overhead' in slug:
        return "1. Mantenha postura ereta com core ativado\n2. Segure o peso na altura dos ombros\n3. Empurre o peso para cima controladamente\n4. Estenda completamente os braços no topo\n5. Desça controladamente até a posição inicial"
    elif 'encolhimento' in slug or 'shrug' in slug:
        return "1. Mantenha braços estendidos ao lado do corpo\n2. Eleve os ombros o máximo possível\n3. Contraia o trapézio no topo\n4. Mantenha a contração por 1-2 segundos\n5. Desça controladamente os ombros"
    else:
        return f"1. Posicione-se corretamente para o exercício\n2. Mantenha boa postura durante todo movimento\n3. Execute o movimento de forma controlada\n4. Contraia o {muscle_group.lower()} durante a execução\n5. Respire adequadamente: expire no esforço, inspire no relaxamento"

# Traduções brasileiras específicas (priorizadas sobre detecção automática)
BRAZILIAN_TRANSLATIONS = {
    "One-Arm-Pronated-Dumbbell-Triceps": {
        "slug": "triceps-unilateral-halter",
        "nome": "Tríceps Unilateral com Halter",
        "equipamento": "Halteres",
        "tipo": "padrao",
        "dificuldade": "Alta"
    },
    "tricep dip": {
        "slug": "mergulho-triceps",
        "nome": "Mergulho para Tríceps",
        "equipamento": "Peso Corporal",
        "tipo": "padrao",
        "dificuldade": "Média"
    },
    "pull up": {
        "slug": "barra-fixa",
        "nome": "Barra Fixa",
        "equipamento": "Peso Corporal",
        "tipo": "padrao",
        "dificuldade": "Média"
    }
}

class ExerciseProcessor:
    def __init__(self):
        """Inicializa processador"""
        # Google Drive
        creds = Credentials.from_service_account_file(CREDENTIALS_PATH)
        self.drive_service = build('drive', 'v3', credentials=creds)
        
        # Supabase
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    def list_folder_contents(self, folder_id):
        """Lista conteúdo de pasta do Google Drive"""
        results = self.drive_service.files().list(
            q=f"'{folder_id}' in parents",
            fields="files(id, name, mimeType)"
        ).execute()
        return results.get('files', [])
    
    def download_file(self, file_id):
        """Baixa arquivo do Google Drive"""
        request = self.drive_service.files().get_media(fileId=file_id)
        file_content = io.BytesIO()
        
        from googleapiclient.http import MediaIoBaseDownload
        downloader = MediaIoBaseDownload(file_content, request)
        
        done = False
        while done is False:
            status, done = downloader.next_chunk()
        
        file_content.seek(0)
        return file_content
    
    def convert_to_webp(self, image_content, original_filename, quality=85):
        """Converte imagem para WebP ou retorna WebP existente"""
        try:
            # Verifica se já é WebP
            if original_filename.lower().endswith('.webp'):
                print(f"   ✅ Já é WebP, usando arquivo original")
                image_content.seek(0)
                return image_content
            
            # Converte outros formatos
            extension = original_filename.split('.')[-1].upper()
            print(f"   🔄 Convertendo {extension} para WebP")
            
            image = Image.open(image_content)
            
            # Para GIFs animados, pega apenas o primeiro frame
            if hasattr(image, 'is_animated') and image.is_animated:
                image.seek(0)
                image = image.convert('RGB')
                print(f"   📹 GIF animado convertido para imagem estática")
            
            # Converte para RGB se necessário
            if image.mode in ('RGBA', 'LA', 'P'):
                image = image.convert('RGB')
            
            # Otimiza tamanho (max 800px)
            if image.width > 800 or image.height > 800:
                image.thumbnail((800, 800), Image.Resampling.LANCZOS)
                print(f"   📏 Redimensionado para {image.width}x{image.height}")
            
            # Converte para WebP
            webp_content = io.BytesIO()
            image.save(webp_content, 'WEBP', quality=quality, optimize=True)
            webp_content.seek(0)
            
            webp_size = len(webp_content.getvalue())
            print(f"   💾 WebP gerado: {webp_size // 1024}KB")
            
            return webp_content
            
        except Exception as e:
            print(f"❌ Erro convertendo imagem {original_filename}: {e}")
            return None
    
    def upload_to_bucket(self, file_content, file_path):
        """Upload para Supabase Storage"""
        try:
            file_content.seek(0)
            file_bytes = file_content.read()
            
            response = self.supabase.storage.from_(BUCKET_NAME).upload(
                path=file_path,
                file=file_bytes,
                file_options={"content-type": "image/webp"}
            )
            
            # Verifica se há erro no response
            if hasattr(response, 'error') and response.error:
                print(f"❌ Erro no upload Supabase: {response.error}")
                return None
            
            # Se chegou aqui, upload foi bem-sucedido
            public_url = self.supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)
            return public_url
            
        except Exception as e:
            print(f"❌ Erro no upload: {e}")
            return None
    
    def insert_to_database(self, exercise_data):
        """Insere exercício no banco Supabase"""
        try:
            result = self.supabase.table('exercicios').insert(exercise_data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"❌ Erro inserindo no banco: {e}")
            return None
    
    def process_exercise(self, file_info, folder_name):
        """Processa um exercício completo"""
        print(f"🔄 Processando: {file_info['name']}")
        
        # Remove extensão para buscar tradução
        clean_name = file_info['name'].rsplit('.', 1)[0]
        
        # Busca tradução específica ou cria automaticamente
        translation = BRAZILIAN_TRANSLATIONS.get(clean_name)
        if not translation:
            slug = clean_name.lower().replace(' ', '-').replace('(', '').replace(')', '')
            slug = remove_accents(slug)
            
            # Detecção automática de equipamento e dificuldade
            detected_equipment = detect_equipment(clean_name)
            detected_difficulty = detect_difficulty(clean_name)
            
            print(f"   🔍 Detectado: {detected_equipment} | {detected_difficulty}")
            
            translation = {
                "slug": slug,
                "nome": clean_name.title(),
                "equipamento": detected_equipment,
                "tipo": "padrao",
                "dificuldade": detected_difficulty
            }
        else:
            print(f"   📚 Tradução específica encontrada")
        
        # Dados do exercício
        muscle_group = folder_name.title()
        description = generate_description(muscle_group)
        instructions = generate_instructions(translation['slug'], muscle_group)
        
        # Baixa arquivo
        print(f"   📥 Baixando arquivo...")
        file_content = self.download_file(file_info['id'])
        if not file_content:
            return None
        
        # Converte para WebP (se necessário)
        webp_content = self.convert_to_webp(file_content, file_info['name'])
        if not webp_content:
            return None
        
        # Upload para bucket
        folder_clean = remove_accents(folder_name.lower())
        file_path = f"{folder_clean}/{translation['slug']}.webp"
        print(f"   ☁️ Upload para: {file_path}")
        video_url = self.upload_to_bucket(webp_content, file_path)
        if not video_url:
            return None
        
        # Dados para o banco
        exercise_data = {
            'nome': translation['nome'],
            'grupo_muscular': muscle_group,
            'equipamento': translation['equipamento'],
            'tipo': translation['tipo'],
            'dificuldade': translation['dificuldade'],
            'descricao': description,
            'instrucoes': instructions,
            'video_url': video_url,
            'slug': translation['slug']
        }
        
        # Insere no banco
        db_result = self.insert_to_database(exercise_data)
        if db_result:
            print(f"✅ {translation['nome']} ({translation['equipamento']} | {translation['dificuldade']}) processado com sucesso!")
            return exercise_data
        
        return None
    
    def process_all_exercises(self):
        """Processa todos os exercícios"""
        print("🚀 Iniciando processamento com detecção automática...")
        
        folders = self.list_folder_contents(GOOGLE_DRIVE_FOLDER_ID)
        
        results = {
            'processed': [],
            'errors': [],
            'summary': {
                'total': 0, 
                'success': 0, 
                'errors': 0,
                'equipment_stats': {},
                'difficulty_stats': {}
            }
        }
        
        for folder in folders:
            if folder['mimeType'] == 'application/vnd.google-apps.folder':
                folder_name = folder['name']
                print(f"\n📁 Processando pasta: {folder_name}")
                
                exercises = self.list_folder_contents(folder['id'])
                
                for exercise in exercises:
                    if (exercise['mimeType'].startswith('image/') or 
                        exercise['name'].lower().endswith(('.webp', '.gif', '.png', '.jpg', '.jpeg'))):
                        
                        results['summary']['total'] += 1
                        
                        processed = self.process_exercise(exercise, folder_name)
                        if processed:
                            results['processed'].append(processed)
                            results['summary']['success'] += 1
                            
                            # Estatísticas
                            equip = processed['equipamento']
                            diff = processed['dificuldade']
                            results['summary']['equipment_stats'][equip] = results['summary']['equipment_stats'].get(equip, 0) + 1
                            results['summary']['difficulty_stats'][diff] = results['summary']['difficulty_stats'].get(diff, 0) + 1
                        else:
                            results['errors'].append(f"{folder_name}/{exercise['name']}")
                            results['summary']['errors'] += 1
        
        print(f"""
        🎯 PROCESSAMENTO CONCLUÍDO!
        📊 Total: {results['summary']['total']}
        ✅ Sucessos: {results['summary']['success']} 
        ❌ Erros: {results['summary']['errors']}
        
        📋 EQUIPAMENTOS:
        {json.dumps(results['summary']['equipment_stats'], indent=2, ensure_ascii=False)}
        
        📋 DIFICULDADES:
        {json.dumps(results['summary']['difficulty_stats'], indent=2, ensure_ascii=False)}
        """)
        
        return results

# Execução principal
if __name__ == "__main__":
    print("🇧🇷 Processador de Exercícios - Versão com Detecção Automática")
    print("=" * 70)
    
    processor = ExerciseProcessor()
    results = processor.process_all_exercises()
    
    # Salva resultados
    with open('results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print("📄 Resultados salvos em: results.json")
    print("🎉 Processamento concluído!")