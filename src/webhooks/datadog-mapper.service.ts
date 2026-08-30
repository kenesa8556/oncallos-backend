import { Injectable } from '@nestjs/common';

@Injectable()
export class DatadogMapperService {
  mapSeverity(alertType: string, priority?: string): 'low' | 'medium' | 'high' {
    // Datadog alert_type values: error, warning, success, info
    // Mapping documented here per the plan's requirement to document severity mapping:
    switch (alertType) {
      case 'error':
        return 'high';
      case 'warning':
        return 'medium';
      case 'success':
      case 'info':
      default:
        return 'low';
    }
  }

  extractServiceName(tags: string): string {
    if (!tags) return 'unknown';
    // Datadog tags often look like: "service:checkout-api,env:prod,team:backend"
    const tagList = tags.split(',');
    const serviceTag = tagList.find((t) => t.trim().startsWith('service:'));
    return serviceTag ? serviceTag.split(':')[1] : 'unknown';
  }

  mapToInternalAlert(payload: any) {
    return {
      title: payload.title,
      severity: this.mapSeverity(payload.alert_type, payload.priority),
      service: this.extractServiceName(payload.tags),
    };
  }
}