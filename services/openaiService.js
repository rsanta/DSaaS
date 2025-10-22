import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Realiza búsqueda semántica completa con OpenAI
 * OpenAI procesa todo: normalización, fuzzy matching, interpretación
 */
export const performDeepSearch = async (query, documents, logs = [], params = {}) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured in .env file');
    }

    console.log('Performing deep search with params:', params);
    
    // Preparar contexto completo de documentos
    const documentsContext = documents.map((doc, idx) => {
      return `Documento ${idx + 1}:
ID: ${doc.id}
Estudiante: ${doc.studentName || 'No especificado'}
Código Estudiante: ${doc.studentId || 'N/A'}
UID: ${doc.studentUid || 'N/A'}
Tipo de Documento: ${doc.documentType || 'No especificado'}
Estado: ${doc.status || 'No especificado'}
Fecha de Solicitud: ${doc.requestDate || 'No especificado'}
Última Actualización: ${doc.lastUpdate || 'No especificado'}
${doc.details ? `Detalles: ${doc.details}` : ''}
${doc.fileUrl ? `URL: ${doc.fileUrl}` : ''}
---`;
    }).join('\n\n');

    const logsContext = logs.length > 0 ? logs.map((log, idx) => {
      return `Log ${idx + 1}:
ID: ${log.id}
Fecha y Hora: ${log.timestamp}
Usuario: ${log.user}
Rol: ${log.role}
Acción: ${log.action}
Documento: ${log.documentId}
Detalles: ${log.details}
---`;
    }).join('\n\n') : 'No hay registros de auditoría disponibles.';

    // Construir criterios de búsqueda en lenguaje natural
    const searchCriteria = [];
    if (params.nombre) searchCriteria.push(`Nombre del estudiante similar a: "${params.nombre}"`);
    if (params.codigoEstudiante) searchCriteria.push(`Código de estudiante: "${params.codigoEstudiante}"`);
    if (params.identificacionEstudiante) searchCriteria.push(`Identificación/UID: "${params.identificacionEstudiante}"`);
    if (params.programa) searchCriteria.push(`Programa académico: "${params.programa}"`);
    if (params.facultad) searchCriteria.push(`Facultad: "${params.facultad}"`);
    if (params.seccional) searchCriteria.push(`Seccional: "${params.seccional}"`);
    if (params.tipoDocumento) searchCriteria.push(`Tipo de documento: "${params.tipoDocumento}"`);
    if (params.anoDocumento) searchCriteria.push(`Año del documento: "${params.anoDocumento}"`);
    if (params.mesDocumento) searchCriteria.push(`Mes del documento: "${params.mesDocumento}" (puede ser nombre del mes, abreviatura o número)`);
    if (params.diaDocumento) searchCriteria.push(`Día del documento: "${params.diaDocumento}"`);
    if (params.firmadoPor) searchCriteria.push(`Firmado por: "${params.firmadoPor}"`);

    const searchCriteriaText = searchCriteria.length > 0 
      ? searchCriteria.join('\n- ') 
      : 'Mostrar todos los documentos disponibles';

    const prompt = `Eres un asistente experto en búsqueda de documentos académicos. Tu tarea es analizar los documentos disponibles y encontrar aquellos que mejor coincidan con los criterios de búsqueda.

IMPORTANTE - REGLAS DE BÚSQUEDA APROXIMADA:
1. Para nombres: Busca coincidencias aproximadas, similar spelling, nombres parciales
   - Ejemplo: "Daniel Leonardo Gonzalez Torres" debe encontrar "daniell-gonzalez" o "Daniel Gonzalez"
2. Para meses: Acepta cualquier formato
   - "10", "octubre", "oct", "Octubre", "OCTUBRE" deben ser equivalentes
   - "1" = "enero" = "ene"
3. Para fechas: Parsea las fechas en formato "DD/MM/YYYY" o timestamps
4. Para emails/UIDs: Busca coincidencias parciales
5. Si un criterio está vacío o es muy vago, ignóralo

TODOS LOS DOCUMENTOS DISPONIBLES EN LA BASE DE DATOS:
${documentsContext}

REGISTRO DE AUDITORÍA:
${logsContext}

CRITERIOS DE BÚSQUEDA DEL USUARIO:
${searchCriteriaText}

CONSULTA TEXTUAL: ${query}

INSTRUCCIONES DE RESPUESTA:
1. Analiza TODOS los documentos y encuentra los que mejor coincidan con los criterios
2. Usa lógica de búsqueda aproximada (fuzzy matching) para nombres
3. Normaliza meses automáticamente (octubre = 10 = oct)
4. Retorna ÚNICAMENTE un JSON válido con esta estructura exacta:

{
  "summary": "Descripción breve de lo encontrado (máximo 3 frases)",
  "matchedDocumentIds": ["id1", "id2", "id3"],
  "totalMatches": número,
  "confidence": "alta/media/baja",
  "suggestions": ["sugerencia1", "sugerencia2"]
}

CRÍTICO: 
- Incluye en "matchedDocumentIds" los IDs de TODOS los documentos que coincidan
- Si no hay coincidencias exactas pero hay aproximadas, inclúyelas con confidence "media" o "baja"
- Si no encuentras nada, retorna "matchedDocumentIds": [] y explica en "summary"
- NO incluyas explicaciones fuera del JSON
- SOLO retorna el JSON, nada más`;

    console.log('Sending request to OpenAI...');

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente especializado en búsqueda documental con capacidades de fuzzy matching y normalización de datos. SIEMPRE respondes con JSON válido.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const aiResponse = response.choices[0].message.content;
    console.log('OpenAI Response:', aiResponse);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Raw response:', aiResponse);
      throw new Error('Error al parsear la respuesta de OpenAI');
    }

    // Filtrar documentos basados en los IDs que OpenAI identificó
    const matchedDocuments = documents.filter(doc => 
      parsedResponse.matchedDocumentIds && 
      parsedResponse.matchedDocumentIds.includes(doc.id)
    );

    console.log(`OpenAI matched ${matchedDocuments.length} documents`);

    return {
      summary: parsedResponse.summary || 'Búsqueda completada',
      results: matchedDocuments.map(doc => ({
        id: doc.id,
        studentName: doc.studentName,
        studentId: doc.studentId,
        studentUid: doc.studentUid,
        documentType: doc.documentType,
        status: doc.status,
        requestDate: doc.requestDate,
        lastUpdate: doc.lastUpdate,
        fileUrl: doc.fileUrl,
        details: doc.details
      })),
      suggestions: parsedResponse.suggestions || [],
      confidence: parsedResponse.confidence || 'media',
      totalMatches: parsedResponse.totalMatches || matchedDocuments.length
    };

  } catch (error) {
    console.error('Error in performDeepSearch:', error);
    
    // Si es error de OpenAI, dar más detalles
    if (error.response) {
      console.error('OpenAI API Error:', error.response.data);
    }
    
    throw new Error(`Error al procesar la búsqueda: ${error.message}`);
  }
};

export default { performDeepSearch };