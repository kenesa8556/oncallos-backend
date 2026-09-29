import { Injectable } from '@nestjs/common';

const RAILWAY_API_URL = 'https://backboard.railway.com/graphql/v2';

@Injectable()
export class RailwayTool {
  async restartService(token: string, serviceId: string, environmentId: string) {
    const res = await fetch(RAILWAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Project-Access-Token': token,
      },
      body: JSON.stringify({
        query: `mutation { serviceInstanceRedeploy(serviceId: "${serviceId}", environmentId: "${environmentId}") }`,
      }),
    });

    const data = await res.json();

    if (data.errors) {
      throw new Error(`Railway API error: ${JSON.stringify(data.errors)}`);
    }

    return { success: data.data?.serviceInstanceRedeploy === true };
  }

async scaleReplicas(token: string, serviceId: string, environmentId: string, numReplicas: number) {
  const res = await fetch(RAILWAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Project-Access-Token': token,
    },
    body: JSON.stringify({
      query: `
        mutation {
          serviceInstanceUpdate(
            serviceId: "${serviceId}",
            environmentId: "${environmentId}",
            input: { numReplicas: ${numReplicas} }
          )
        }
      `,
    }),
  });

  const data = await res.json();
  if (data.errors) {
    throw new Error(`Railway API error: ${JSON.stringify(data.errors)}`);
  }
  return { success: data.data?.serviceInstanceUpdate === true };
}



  async getServiceStatus(token: string, serviceId: string, environmentId: string): Promise<string | null> {
  try {
    const res = await fetch(RAILWAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Project-Access-Token': token,
      },
      body: JSON.stringify({
        query: `
          query {
            deployments(first: 1, input: { serviceId: "${serviceId}", environmentId: "${environmentId}" }) {
              edges { node { id status } }
            }
          }
        `,
      }),
    });

    const data = await res.json();
    if (data.errors) {
      throw new Error(`Railway API error: ${JSON.stringify(data.errors)}`);
    }
    return data.data?.deployments?.edges?.[0]?.node?.status ?? null;
  } catch (err: any) {
    console.error('[getServiceStatus RAW ERROR]', err); // full error object, not just .message
    throw err;
  }
}
  async getCurrentDeployment(token: string, serviceId: string, environmentId: string) {
  const res = await fetch(RAILWAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Project-Access-Token': token,
    },
    body: JSON.stringify({
      query: `
        query {
          deployments(first: 1, input: { serviceId: "${serviceId}", environmentId: "${environmentId}" }) {
            edges { node { id status createdAt } }
          }
        }
      `,
    }),
  });

  const data = await res.json();

  if (data.errors) {
    throw new Error(`Railway API error: ${JSON.stringify(data.errors)}`);
  }

  const node = data.data?.deployments?.edges?.[0]?.node;
  if (!node) throw new Error('Could not fetch current deployment for snapshot');
  return node;
}

async findRollbackTarget(token: string, serviceId: string, environmentId: string) {
  const res = await fetch(RAILWAY_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Project-Access-Token': token },
    body: JSON.stringify({
      query: `
        query {
          deployments(first: 5, input: { serviceId: "${serviceId}", environmentId: "${environmentId}" }) {
            edges { node { id status createdAt canRollback } }
          }
        }
      `,
    }),
  });
  const data = await res.json();
  if (data.errors) throw new Error(`Railway API error: ${JSON.stringify(data.errors)}`);

  const deployments = data.data?.deployments?.edges?.map((e: any) => e.node) ?? [];
  // Skip index 0 (current live deployment), then find the most recent
  // prior deployment Railway itself marks as rollback-eligible.
  // Note: Railway marks a replaced deployment REMOVED even though it
  // was a real successful deploy at the time — canRollback is the
  // correct signal here, not status.
  const target = deployments.slice(1).find((d: any) => d.canRollback);
  if (!target) throw new Error('No eligible prior deployment found to roll back to');
  return target;
}

async clearCache(token: string, serviceId: string, environmentId: string) {
  const res = await fetch(RAILWAY_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Project-Access-Token': token },
    body: JSON.stringify({
      query: `
        mutation($input: PurgeServiceCacheInput!) {
          purgeServiceCache(input: $input)
        }
      `,
      variables: { input: { serviceId, environmentId, scope: 'ALL' } },
    }),
  });
  const data = await res.json();
  if (data.errors) throw new Error(`Railway API error: ${JSON.stringify(data.errors)}`);
  return { success: data.data?.purgeServiceCache === true };
}

async rollbackToDeployment(token: string, deploymentId: string) {
  const res = await fetch(RAILWAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Project-Access-Token': token,
    },
    body: JSON.stringify({
      query: `mutation { deploymentRollback(id: "${deploymentId}") }`,
    }),
  });

  const data = await res.json();
  if (data.errors) throw new Error(`Railway rollback error: ${JSON.stringify(data.errors)}`);
  return { success: data.data?.deploymentRollback === true };
}
}