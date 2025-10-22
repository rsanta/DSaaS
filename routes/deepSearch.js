import express from 'express';
import { fetchDocuments, fetchLogbook } from '../services/firebaseService.js';
import { performDeepSearch } from '../services/openaiService.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Query parameter is required',
        example: '/deepsearch?query=documentos de octubre'
      });
    }

    console.log(`Processing GET query: "${query}"`);

    const documents = await fetchDocuments();
    const logs = await fetchLogbook();

    if (documents.length === 0) {
      return res.json({
        query,
        response: 'No se encontraron documentos en la base de datos.',
        results: [],
        documentsAnalyzed: 0
      });
    }

    const searchResults = await performDeepSearch(query, documents, logs, {});

    res.json({
      query,
      response: searchResults.summary,
      results: searchResults.results,
      suggestions: searchResults.suggestions,
      confidence: searchResults.confidence,
      documentsAnalyzed: documents.length,
      documentsFound: searchResults.results.length,
      logsAnalyzed: logs.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const params = req.body;
    console.log('Received deep search parameters:', params);

    const documents = await fetchDocuments();
    const logs = await fetchLogbook();

    if (documents.length === 0) {
      return res.json({
        query: 'Búsqueda con filtros',
        response: 'No se encontraron documentos en la base de datos.',
        results: [],
        documentsAnalyzed: 0
      });
    }

    const queryParts = [];
    if (params.nombre) queryParts.push(`estudiante "${params.nombre}"`);
    if (params.codigoEstudiante) queryParts.push(`código "${params.codigoEstudiante}"`);
    if (params.tipoDocumento) queryParts.push(`tipo "${params.tipoDocumento}"`);
    if (params.mesDocumento) queryParts.push(`mes "${params.mesDocumento}"`);
    if (params.anoDocumento) queryParts.push(`año "${params.anoDocumento}"`);
    
    const naturalQuery = queryParts.length > 0 
      ? `Buscar documentos de ${queryParts.join(', ')}` 
      : 'Buscar todos los documentos';

    const searchResults = await performDeepSearch(naturalQuery, documents, logs, params);

    res.json({
      query: naturalQuery,
      response: searchResults.summary,
      results: searchResults.results,
      suggestions: searchResults.suggestions,
      confidence: searchResults.confidence,
      filters: params,
      documentsAnalyzed: documents.length,
      documentsFound: searchResults.results.length,
      logsAnalyzed: logs.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Search error:', error);
    next(error);
  }
});

export default router;