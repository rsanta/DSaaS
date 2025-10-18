import express from 'express';
import { fetchDocuments, fetchLogbook } from '../services/firebaseService.js';
import { performDeepSearch } from '../services/openaiService.js';

const router = express.Router();

/**
 * GET /deepsearch?query=<text>
 * Performs semantic search on documents stored in ODLaaS
 */
router.get('/', async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Query parameter is required',
        example: '/deepsearch?query=sostenibilidad'
      });
    }

    console.log(`Processing query: "${query}"`);

    const documents = await fetchDocuments();
    const logs = await fetchLogbook();

    if (documents.length === 0) {
      return res.json({
        query,
        response: 'No se encontraron documentos en la base de datos para analizar.',
        documentsAnalyzed: 0,
        logsAnalyzed: 0
      });
    }

    const aiResponse = await performDeepSearch(query, documents, logs);

    res.json({
      query,
      response: aiResponse,
      documentsAnalyzed: documents.length,
      logsAnalyzed: logs.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /deepsearch
 * Alternative endpoint for complex queries with JSON body
 */
router.post('/', async (req, res, next) => {
  try {
    const { query, filters } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Query field is required in request body'
      });
    }

    console.log(`Processing POST query: "${query}"`);

    let documents = await fetchDocuments();
    let logs = await fetchLogbook();

    if (filters && filters.studentId) {
      documents = documents.filter(doc => 
        doc.studentId && doc.studentId === filters.studentId
      );
      logs = logs.filter(log => 
        documents.some(doc => doc.id === log.documentId)
      );
    }

    if (filters && filters.status) {
      documents = documents.filter(doc => 
        doc.status && doc.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    if (documents.length === 0) {
      return res.json({
        query,
        response: 'No se encontraron documentos que coincidan con los filtros aplicados.',
        documentsAnalyzed: 0,
        logsAnalyzed: 0
      });
    }

    const aiResponse = await performDeepSearch(query, documents, logs);

    res.json({
      query,
      response: aiResponse,
      documentsAnalyzed: documents.length,
      logsAnalyzed: logs.length,
      filtersApplied: filters || null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
});

export default router;