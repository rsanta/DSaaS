import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Normaliza el mes a número (1-12)
 */
const normalizeMonth = (monthInput) => {
  if (!monthInput) return null;
  
  const input = String(monthInput).toLowerCase().trim();
  
  const monthMappings = {
    '1': 1, '01': 1, 'enero': 1, 'ene': 1, 'jan': 1, 'january': 1,
    '2': 2, '02': 2, 'febrero': 2, 'feb': 2, 'february': 2,
    '3': 3, '03': 3, 'marzo': 3, 'mar': 3, 'march': 3,
    '4': 4, '04': 4, 'abril': 4, 'abr': 4, 'apr': 4, 'april': 4,
    '5': 5, '05': 5, 'mayo': 5, 'may': 5,
    '6': 6, '06': 6, 'junio': 6, 'jun': 6, 'june': 6,
    '7': 7, '07': 7, 'julio': 7, 'jul': 7, 'july': 7,
    '8': 8, '08': 8, 'agosto': 8, 'ago': 8, 'aug': 8, 'august': 8,
    '9': 9, '09': 9, 'septiembre': 9, 'sep': 9, 'sept': 9, 'september': 9,
    '10': 10, 'octubre': 10, 'oct': 10, 'october': 10,
    '11': 11, 'noviembre': 11, 'nov': 11, 'november': 11,
    '12': 12, 'diciembre': 12, 'dic': 12, 'dec': 12, 'december': 12
  };
  
  return monthMappings[input] || null;
};

/**
 * Extrae el mes de una fecha (maneja timestamps, strings DD/MM/YYYY, ISO dates)
 */
const extractMonth = (dateValue) => {
  if (!dateValue) return null;
  
  try {
    // Si es un número (timestamp)
    if (typeof dateValue === 'number') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.getMonth() + 1; // getMonth() retorna 0-11, queremos 1-12
      }
    }
    
    // Si es un string
    if (typeof dateValue === 'string') {
      // Formato DD/MM/YYYY
      if (dateValue.includes('/')) {
        const parts = dateValue.split('/');
        if (parts.length === 3) {
          return parseInt(parts[1], 10); // El mes está en la posición 1
        }
      }
      
      // Intentar parsear como fecha ISO o timestamp string
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.getMonth() + 1;
      }
    }
  } catch (error) {
    console.error('Error extracting month from:', dateValue, error.message);
  }
  
  return null;
};

/**
 * Extrae el año de una fecha
 */
const extractYear = (dateValue) => {
  if (!dateValue) return null;
  
  try {
    // Si es un número (timestamp)
    if (typeof dateValue === 'number') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.getFullYear();
      }
    }
    
    // Si es un string
    if (typeof dateValue === 'string') {
      // Formato DD/MM/YYYY
      if (dateValue.includes('/')) {
        const parts = dateValue.split('/');
        if (parts.length === 3) {
          return parseInt(parts[2], 10);
        }
      }
      
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.getFullYear();
      }
    }
  } catch (error) {
    console.error('Error extracting year from:', dateValue, error.message);
  }
  
  return null;
};

/**
 * Extrae el día de una fecha
 */
const extractDay = (dateValue) => {
  if (!dateValue) return null;
  
  try {
    // Si es un número (timestamp)
    if (typeof dateValue === 'number') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.getDate();
      }
    }
    
    // Si es un string
    if (typeof dateValue === 'string') {
      // Formato DD/MM/YYYY
      if (dateValue.includes('/')) {
        const parts = dateValue.split('/');
        if (parts.length === 3) {
          return parseInt(parts[0], 10);
        }
      }
      
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.getDate();
      }
    }
  } catch (error) {
    console.error('Error extracting day from:', dateValue, error.message);
  }
  
  return null;
};

/**
 * Pre-filtra documentos por fecha antes de enviar a OpenAI
 */
const preFilterDocuments = (documents, params) => {
  let filtered = [...documents];
  
  // Filtrar por mes si está especificado
  if (params.mesDocumento) {
    const targetMonth = normalizeMonth(params.mesDocumento);
    if (targetMonth) {
      console.log(`Pre-filtering by month: ${targetMonth} (from input: ${params.mesDocumento})`);
      filtered = filtered.filter(doc => {
        const docMonth = extractMonth(doc.requestDate);
        const match = docMonth === targetMonth;
        if (!match) {
          console.log(`Excluded: ${doc.id} - Month ${docMonth} doesn't match ${targetMonth} (requestDate: ${doc.requestDate})`);
        } else {
          console.log(`Included: ${doc.id} - Month ${docMonth} matches ${targetMonth}`);
        }
        return match;
      });
      console.log(`After month filter: ${filtered.length} documents`);
    }
  }
  
  // Filtrar por año si está especificado
  if (params.anoDocumento) {
    const targetYear = parseInt(params.anoDocumento, 10);
    console.log(`Pre-filtering by year: ${targetYear}`);
    filtered = filtered.filter(doc => {
      const year = extractYear(doc.requestDate);
      const match = year === targetYear;
      if (!match) {
        console.log(`Excluded: ${doc.id} - Year ${year} doesn't match ${targetYear}`);
      }
      return match;
    });
    console.log(`After year filter: ${filtered.length} documents`);
  }
  
  // Filtrar por día si está especificado
  if (params.diaDocumento) {
    const targetDay = parseInt(params.diaDocumento, 10);
    console.log(`Pre-filtering by day: ${targetDay}`);
    filtered = filtered.filter(doc => {
      const day = extractDay(doc.requestDate);
      const match = day === targetDay;
      if (!match) {
        console.log(`Excluded: ${doc.id} - Day ${day} doesn't match ${targetDay}`);
      }
      return match;
    });
    console.log(`After day filter: ${filtered.length} documents`);
  }
  
  return filtered;
};

/**
 * Formatea una fecha para mostrar
 */
const formatDate = (dateValue) => {
  if (!dateValue) return 'No especificado';
  
  try {
    if (typeof dateValue === 'number') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('es-CO', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
      }
    }
    
    if (typeof dateValue === 'string') {
      if (dateValue.includes('/')) {
        return dateValue; // Ya está en formato DD/MM/YYYY
      }
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('es-CO', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
      }
    }
  } catch (error) {
    console.error('Error formatting date:', dateValue, error.message);
  }
  
  return String(dateValue);
};

/**
 * Realiza búsqueda semántica completa con OpenAI
 */
export const performDeepSearch = async (query, documents, logs = [], params = {}) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured in .env file');
    }

    console.log('Performing deep search with params:', params);
    console.log(`Total documents before filtering: ${documents.length}`);
    
    // PRE-FILTRAR por fechas (año, mes, día) ANTES de enviar a OpenAI
    const preFilteredDocs = preFilterDocuments(documents, params);
    console.log(`Documents after pre-filtering: ${preFilteredDocs.length}`);
    
    // Si no hay documentos después del pre-filtro, retornar resultado vacío
    if (preFilteredDocs.length === 0) {
      return {
        summary: 'No se encontraron documentos que coincidan con los criterios de fecha especificados.',
        results: [],
        suggestions: ['Verifica que el mes, año o día sean correctos', 'Intenta ampliar los criterios de búsqueda'],
        confidence: 'alta',
        totalMatches: 0
      };
    }
    
    // Preparar contexto SOLO con documentos pre-filtrados
    const documentsContext = preFilteredDocs.slice(0, 50).map((doc, idx) => {
      return `Documento ${idx + 1}:
ID: ${doc.id}
Estudiante: ${doc.studentName || 'No especificado'}
Código: ${doc.studentId || 'N/A'}
UID: ${doc.studentUid || 'N/A'}
Tipo: ${doc.documentType || 'No especificado'}
Estado: ${doc.status || 'No especificado'}
Fecha: ${formatDate(doc.requestDate)}
---`;
    }).join('\n\n');

    // Construir criterios simplificados
    const searchCriteria = [];
    if (params.nombre) searchCriteria.push(`Nombre: "${params.nombre}"`);
    if (params.codigoEstudiante) searchCriteria.push(`Código: "${params.codigoEstudiante}"`);
    if (params.identificacionEstudiante) searchCriteria.push(`UID: "${params.identificacionEstudiante}"`);
    if (params.tipoDocumento) searchCriteria.push(`Tipo: "${params.tipoDocumento}"`);
    if (params.mesDocumento) searchCriteria.push(`Mes: ${params.mesDocumento} (ya filtrado)`);
    if (params.anoDocumento) searchCriteria.push(`Año: ${params.anoDocumento} (ya filtrado)`);
    if (params.diaDocumento) searchCriteria.push(`Día: ${params.diaDocumento} (ya filtrado)`);

    const searchCriteriaText = searchCriteria.length > 0 
      ? searchCriteria.join(', ') 
      : 'Todos los documentos';

    const prompt = `Analiza estos documentos académicos y encuentra los que mejor coincidan.

DOCUMENTOS PRE-FILTRADOS (${preFilteredDocs.length} total):
${documentsContext}

CRITERIOS: ${searchCriteriaText}
CONSULTA: ${query}

REGLAS:
1. Usa fuzzy matching para nombres (ej: "Daniel Gonzalez" coincide con "daniell-gonzalez")
2. Los documentos ya fueron filtrados por fecha, enfócate en otros criterios
3. Si no hay criterios específicos adicionales, retorna todos los IDs disponibles

Responde SOLO con JSON:
{
  "summary": "breve descripción",
  "matchedDocumentIds": ["id1", "id2"],
  "totalMatches": número,
  "confidence": "alta/media/baja",
  "suggestions": []
}`;

    console.log('Sending request to OpenAI...');

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente de búsqueda documental. Respondes SOLO con JSON válido.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const aiResponse = response.choices[0].message.content;
    console.log('OpenAI Response:', aiResponse);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Error al parsear la respuesta de OpenAI');
    }

    // Filtrar documentos basados en IDs (de los pre-filtrados)
    const matchedDocuments = preFilteredDocs.filter(doc => 
      parsedResponse.matchedDocumentIds && 
      parsedResponse.matchedDocumentIds.includes(doc.id)
    );

    console.log(`Final matches: ${matchedDocuments.length} documents`);

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
      totalMatches: matchedDocuments.length
    };

  } catch (error) {
    console.error('Error in performDeepSearch:', error);
    
    if (error.response) {
      console.error('OpenAI API Error:', error.response.data);
    }
    
    throw new Error(`Error al procesar la búsqueda: ${error.message}`);
  }
};

export default { performDeepSearch };