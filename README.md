# DeepSearch as a Service (DSaaS)

Servicio API RESTful de búsqueda semántica inteligente sobre documentos académicos usando OpenAI GPT-4o-mini y Firebase Realtime Database.

## Descripción

DSaaS proporciona búsqueda semántica en lenguaje natural sobre documentos académicos almacenados en Firebase. El servicio analiza documentos y registros de auditoría para responder consultas inteligentes sobre el estado, historial y contenido de los documentos.

## Características

- Búsqueda semántica con lenguaje natural
- Integración con Firebase Realtime Database
- Análisis de documentos y registros de auditoría
- API REST con endpoints GET y POST
- Filtrado por estudiante, estado y tipo de documento

## Requisitos

- Node.js 18+
- npm 9+
- Cuenta Firebase con Realtime Database
- API Key de OpenAI

## Instalación

```bash
# Clonar repositorio
git clone https://github.com/rsanta/DSaaS.git
cd DSaaS

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales
```

## Configuración

Crear archivo `.env` con las siguientes variables:

```bash
# Servidor
PORT=8000
NODE_ENV=development

# Firebase
FIREBASE_API_KEY=tu_api_key
FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
FIREBASE_DATABASE_URL=https://tu_proyecto.firebaseio.com
FIREBASE_PROJECT_ID=tu_proyecto_id
FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
FIREBASE_APP_ID=tu_app_id

# OpenAI
OPENAI_API_KEY=tu_openai_key
OPENAI_MODEL=gpt-4o-mini
```

### Estructura de Datos en Firebase

#### Colección: `documentos`
```json
{
  "DOC001": {
    "id": "DOC001",
    "studentUid": "uid-estudiante",
    "studentName": "Nombre Estudiante",
    "studentId": "20230101",
    "documentType": "Diploma|Certificate|Enrollment",
    "status": "Solicitado|EnProceso|Firmado|Entregado|Cancelado",
    "requestDate": "2024-01-15",
    "lastUpdate": "2024-07-20",
    "fileUrl": "https://...",
    "details": "Información adicional"
  }
}
```

#### Colección: `logbook`
```json
{
  "LOG001": {
    "id": "LOG001",
    "timestamp": "2024-07-20T10:05:15Z",
    "user": "usuario@ejemplo.com",
    "role": "Secretary|Student|Administrator",
    "action": "Firma de Documento",
    "documentId": "DOC001",
    "details": "Documento firmado digitalmente"
  }
}
```

## Uso

### Iniciar servidor

```bash
# Desarrollo (con auto-reload)
npm run dev

# Producción
npm start
```

El servidor se ejecuta en `http://localhost:8000`

### Endpoints

#### GET /health
Verificar estado del servicio

```bash
curl http://localhost:8000/health
```

#### GET /deepsearch
Búsqueda semántica simple

```bash
curl "http://localhost:8000/deepsearch?query=documentos%20de%20Ana%20García"
```

#### POST /deepsearch
Búsqueda con filtros

```bash
curl -X POST http://localhost:8000/deepsearch \
  -H "Content-Type: application/json" \
  -d '{
    "query": "¿Qué documentos tiene este estudiante?",
    "filters": {
      "studentId": "20230101"
    }
  }'
```

### Ejemplos de Consultas

```bash
# Buscar por documento específico
curl "http://localhost:8000/deepsearch?query=qué%20pasó%20con%20DOC001"

# Buscar documentos de un estudiante
curl "http://localhost:8000/deepsearch?query=documentos%20de%20Ana%20García"

# Buscar por estado
curl "http://localhost:8000/deepsearch?query=documentos%20en%20proceso"

# Buscar por tipo
curl "http://localhost:8000/deepsearch?query=cuántos%20diplomas%20hay"

# Historial de auditoría
curl "http://localhost:8000/deepsearch?query=quién%20firmó%20DOC001"
```

## Estructura del Proyecto

```
dsaas/
├── server.js                    # Servidor principal
├── package.json                 # Dependencias
├── .env                         # Variables de entorno (no incluir en git)
├── .env.example                 # Plantilla de variables
│
├── config/
│   └── firebase.js              # Configuración Firebase
│
├── services/
│   ├── firebaseService.js       # Servicio de datos Firebase
│   └── openaiService.js         # Servicio OpenAI
│
├── routes/
│   └── deepSearch.js            # Endpoints API
│
└── middleware/
    └── errorHandler.js          # Manejo de errores
```

## Respuestas de la API

### Respuesta exitosa

```json
{
  "query": "documentos de Ana García",
  "response": "Ana García tiene dos documentos: DOC001 (Diploma, Firmado) y DOC004 (Certificado, Solicitado).",
  "documentsAnalyzed": 5,
  "logsAnalyzed": 4,
  "timestamp": "2025-10-18T23:00:00.000Z"
}
```

### Respuesta con error

```json
{
  "error": "Bad Request",
  "message": "Query parameter is required",
  "example": "/deepsearch?query=tu_consulta"
}
```

## Solución de Problemas

### Error: permission_denied
- Verifica las reglas de seguridad en Firebase Console
- Para desarrollo, usa reglas abiertas:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### Error: OPENAI_API_KEY missing
- Verifica que el archivo `.env` existe en la raíz del proyecto
- Confirma que la variable `OPENAI_API_KEY` está configurada
- Reinicia el servidor después de modificar `.env`

### Error: Module import
- Verifica que `"type": "module"` está en `package.json`
- Asegúrate de usar la extensión `.js` en todos los imports

## Tecnologías

- **Node.js** - Entorno de ejecución
- **Express** - Framework web
- **Firebase** - Base de datos en tiempo real
- **OpenAI GPT-4o-mini** - Motor de búsqueda semántica
- **dotenv** - Gestión de variables de entorno

## Seguridad

- No incluyas el archivo `.env` en el repositorio
- Usa reglas de seguridad apropiadas en Firebase para producción
- Implementa autenticación para endpoints en producción
- Rotación regular de API keys

## Autor

**Daniel Leonardo González Torres**

## Repositorio

https://github.com/rsanta/DSaaS
