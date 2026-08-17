export interface Alert {
  title: string;
  severity: 'low' | 'medium' | 'high';
  service: string;
}

export interface SimilarIncident {
  title: string;
  rootCause: string;
  resolution: string;
  similarity: number;
}

export interface IncidentContext {
  alert: Alert;
  similarIncidents: SimilarIncident[];
}