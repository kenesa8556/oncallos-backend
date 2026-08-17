import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import{ EmbeddingsService}  from '../embeddings/embeddings.service'; // adjust path to match where this actually lives
import { Alert, IncidentContext, SimilarIncident } from './context.types';

const SIMILARITY_THRESHOLD = 0.70;

@Injectable()
export class ContextBuilderService {
  constructor(
  private readonly supabaseService: SupabaseService,
  private readonly embeddingsService: EmbeddingsService,
) {}

  async buildContext(alert: Alert,excludeIncidentId?: string): Promise<IncidentContext> {
    // Step A: generate an embedding for the incoming alert
    const embedding = await this.embeddingsService.generateEmbedding(alert.title);

    // Step B: find similar past incidents via pgvector
    const { data: matches, error } = await this.supabaseService.client.rpc(
      'match_incidents',
      { query_embedding: embedding, match_count: 3 ,exclude_id: excludeIncidentId ?? null},
    );

    console.log('Raw matches:', matches);

    if (error) {
      console.error('Similarity search failed:', error.message);
      return { alert, similarIncidents: [] };
    }

    // Step C: filter to only those above the similarity threshold
    const relevantMatches = (matches ?? []).filter(
      (m: any) => m.similarity >= SIMILARITY_THRESHOLD,
    );

    if (relevantMatches.length === 0) {
      return { alert, similarIncidents: [] };
    }

    // Step D: for each relevant match, look up its resolution
    const similarIncidents: SimilarIncident[] = [];

    for (const match of relevantMatches) {
      const { data: resolution } = await this.supabaseService.client
        .from('resolutions')
        .select('root_cause, resolution_method')
        .eq('incident_id', match.id)
        .single();

      if (resolution) {
        similarIncidents.push({
          title: match.title,
          rootCause: resolution.root_cause ?? 'Unknown',
          resolution: resolution.resolution_method ?? 'Unknown',
          similarity: match.similarity,
        });
      }
    }

    return { alert, similarIncidents };
  }
}