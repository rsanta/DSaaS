import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const performDeepSearch = async (query, documents, logs = []) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured in .env file');
    }

    const documentsContext = documents.map((doc, idx) => {
      return `Documento ${idx + 1} (${doc.id}):
ID: ${doc.id}
Estudiante: ${doc.studentName} (${doc.studentId})
UID Estudiante: ${doc.studentUid}
Tipo de Documento: ${doc.documentType}
Estado: ${doc.status}
Fecha de Solicitud: ${doc.requestDate}
Última Actualización: ${doc.lastUpdate}
${doc.details ? `Detalles: ${doc.details}` : ''}
${doc.fileUrl ? `URL: ${doc.fileUrl}` : ''}
---`;
    }).join('\n\n');

    const logsContext = logs.length > 0 ? logs.map((log, idx) => {
      return `Log ${idx + 1} (${log.id}):
ID: ${log.id}
Fecha y Hora: ${log.timestamp}
Usuario: ${log.user}
Rol: ${log.role}
Acción: ${log.action}
Documento Relacionado: ${log.documentId}
Detalles: ${log.details}
---`;
    }).join('\n\n') : 'No hay registros de auditoría disponibles.';

    const prompt = `Eres un asistente experto en gestión de documentos académicos del sistema DigiBlock. 
Analiza los siguientes documentos y el registro de auditoría (logbook) para responder a la pregunta del usuario de manera precisa y concisa.

DOCUMENTOS DISPONIBLES:
${documentsContext}

REGISTRO DE AUDITORÍA (LOGBOOK):
${logsContext}

PREGUNTA DEL USUARIO: ${query}

INSTRUCCIONES:
- Responde basándote ÚNICAMENTE en la información de los documentos y logs proporcionados
- Menciona IDs específicos de documentos cuando sea relevante
- Si la pregunta es sobre historial o acciones, consulta el logbook
- Si la pregunta es sobre un estudiante, incluye todos sus documentos y actividades
- Correlaciona la información entre documentos y logs cuando sea útil
- Si no encuentras información relevante, indícalo claramente
- Sé conciso pero completo en tu respuesta`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente especializado en gestión de documentos académicos con acceso al sistema de auditoría. Respondes de manera precisa basándote únicamente en el contenido proporcionado, combinando información de documentos y registros de actividad.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI:', error.message);
    throw new Error('Failed to process query with OpenAI');
  }
};

export default { performDeepSearch };