/**
 * Copy fijo del componente, colocado (convención del DS: los custom con texto
 * propio registran SOLO su diccionario). Port verbatim del molde (es/en/fr) con
 * claves pluralizadas (one/other) e interpolación `{{count}}`/`{{items}}`.
 */
import type { TranslationObject } from '@ngx-translate/core';

export const SC_BULK_TRANSCRIPTION_MODAL_TRANSLATION_KEY = 'sc.bulkTranscriptionModal';

export const SC_BULK_TRANSCRIPTION_MODAL_TRANSLATIONS = {
  es: {
    sc: {
      bulkTranscriptionModal: {
        processingOptionsAriaLabel: 'Opciones de procesamiento',
        title: 'Procesar conversaciones',
        closeAriaLabel: 'Cerrar',
        summaryAriaLabel: 'Total a procesar',
        summaryTitle: 'Total a procesar',
        analysisAriaLabel: 'Análisis',
        analysisTitle: 'Análisis',
        includeAnalysisLabel: 'Incluir análisis',
        includeAnalysisAriaLabel: 'Incluir análisis',
        closeLabel: 'Cerrar',
        processLabel: 'Procesar',
        selectedConversations: {
          one: '{{count}} conversación seleccionada',
          other: '{{count}} conversaciones seleccionadas',
        },
        allProcessed: 'todo procesado',
        analysisCandidates: {
          one: '{{count}} admite análisis',
          other: '{{count}} admiten análisis',
        },
        generatesCost: 'genera coste',
        multiSegmentCalls: {
          one: '{{count}} llamada con varios tramos',
          other: '{{count}} llamadas con varios tramos',
        },
        partialSegmentConversations: {
          one: '{{count}} con tramo ya iniciado',
          other: '{{count}} con tramos ya iniciados',
        },
        inProgress: {
          one: '{{count}} en proceso',
          other: '{{count}} en proceso',
        },
        alreadyProcessed: {
          one: '{{count}} ya procesada',
          other: '{{count}} ya procesadas',
        },
        includes: 'Incluye {{items}}.',
        excludes: 'Excluye {{items}}.',
      },
    },
  },
  en: {
    sc: {
      bulkTranscriptionModal: {
        processingOptionsAriaLabel: 'Processing options',
        title: 'Process conversations',
        closeAriaLabel: 'Close',
        summaryAriaLabel: 'Total to process',
        summaryTitle: 'Total to process',
        analysisAriaLabel: 'Analysis',
        analysisTitle: 'Analysis',
        includeAnalysisLabel: 'Include analysis',
        includeAnalysisAriaLabel: 'Include analysis',
        closeLabel: 'Close',
        processLabel: 'Process',
        selectedConversations: {
          one: '{{count}} selected conversation',
          other: '{{count}} selected conversations',
        },
        allProcessed: 'all processed',
        analysisCandidates: {
          one: '{{count}} eligible for analysis',
          other: '{{count}} eligible for analysis',
        },
        generatesCost: 'generates cost',
        multiSegmentCalls: {
          one: '{{count}} multi-segment call',
          other: '{{count}} multi-segment calls',
        },
        partialSegmentConversations: {
          one: '{{count}} with segments already started',
          other: '{{count}} with segments already started',
        },
        inProgress: {
          one: '{{count}} in progress',
          other: '{{count}} in progress',
        },
        alreadyProcessed: {
          one: '{{count}} already processed',
          other: '{{count}} already processed',
        },
        includes: 'Includes {{items}}.',
        excludes: 'Excludes {{items}}.',
      },
    },
  },
  fr: {
    sc: {
      bulkTranscriptionModal: {
        processingOptionsAriaLabel: 'Options de traitement',
        title: 'Traiter les conversations',
        closeAriaLabel: 'Fermer',
        summaryAriaLabel: 'Total à traiter',
        summaryTitle: 'Total à traiter',
        analysisAriaLabel: 'Analyse',
        analysisTitle: 'Analyse',
        includeAnalysisLabel: "Inclure l'analyse",
        includeAnalysisAriaLabel: "Inclure l'analyse",
        closeLabel: 'Fermer',
        processLabel: 'Traiter',
        selectedConversations: {
          one: '{{count}} conversation sélectionnée',
          other: '{{count}} conversations sélectionnées',
        },
        allProcessed: 'tout traité',
        analysisCandidates: {
          one: "{{count}} éligible à l'analyse",
          other: "{{count}} éligibles à l'analyse",
        },
        generatesCost: 'génère un coût',
        multiSegmentCalls: {
          one: '{{count}} appel avec plusieurs segments',
          other: '{{count}} appels avec plusieurs segments',
        },
        partialSegmentConversations: {
          one: '{{count}} avec des segments déjà démarrés',
          other: '{{count}} avec des segments déjà démarrés',
        },
        inProgress: {
          one: '{{count}} en cours',
          other: '{{count}} en cours',
        },
        alreadyProcessed: {
          one: '{{count}} déjà traitée',
          other: '{{count}} déjà traitées',
        },
        includes: 'Inclut {{items}}.',
        excludes: 'Exclut {{items}}.',
      },
    },
  },
} satisfies Record<string, TranslationObject>;
