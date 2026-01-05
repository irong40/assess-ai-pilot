export interface BreadcrumbConfig {
  label: string;
  parent: string | null;
  dynamic?: boolean;
}

export const BREADCRUMB_CONFIG: Record<string, BreadcrumbConfig> = {
  // Main routes
  '/dashboard': { label: 'Dashboard', parent: null },
  '/new-assessment': { label: 'New Assessment', parent: '/dashboard' },
  '/admin': { label: 'Admin', parent: '/dashboard' },
  '/feedback': { label: 'Feedback', parent: '/dashboard' },
  '/help': { label: 'Help', parent: '/dashboard' },

  // Compliance routes
  '/compliance': { label: 'Compliance', parent: '/dashboard' },
  '/compliance/rag': { label: 'Knowledge AI', parent: '/compliance' },
  '/compliance/poam': { label: 'POA&M', parent: '/compliance' },
  '/compliance/audit': { label: 'Audit Log', parent: '/compliance' },
  '/compliance/documents': { label: 'Documents', parent: '/compliance' },

  // Assessment routes (dynamic)
  '/assessment/:id': { label: 'Assessment', parent: '/dashboard', dynamic: true },
  '/assessment/:id/wizard': { label: 'Wizard', parent: '/assessment/:id', dynamic: true },
  '/assessment/:id/wizard/:domainId': { label: 'Domain', parent: '/assessment/:id/wizard', dynamic: true },
  '/assessment/:id/results': { label: 'Results', parent: '/assessment/:id', dynamic: true },
  '/assessment/:id/summary': { label: 'Summary', parent: '/assessment/:id', dynamic: true },
  '/assessment/:id/issm-review': { label: 'ISSM Review', parent: '/assessment/:id', dynamic: true },
  '/assessment/:id/report': { label: 'Report', parent: '/assessment/:id', dynamic: true },
};

export function matchRoute(pathname: string): { pattern: string; params: Record<string, string> } | null {
  // Try exact match first
  if (BREADCRUMB_CONFIG[pathname]) {
    return { pattern: pathname, params: {} };
  }

  // Try pattern matching for dynamic routes
  const patterns = Object.keys(BREADCRUMB_CONFIG).filter(p => p.includes(':'));
  
  for (const pattern of patterns) {
    const regex = new RegExp(
      '^' + pattern.replace(/:[^/]+/g, '([^/]+)') + '$'
    );
    const match = pathname.match(regex);
    
    if (match) {
      const paramNames = (pattern.match(/:[^/]+/g) || []).map(p => p.slice(1));
      const params: Record<string, string> = {};
      paramNames.forEach((name, index) => {
        params[name] = match[index + 1];
      });
      return { pattern, params };
    }
  }

  return null;
}

export function resolvePattern(pattern: string, params: Record<string, string>): string {
  let resolved = pattern;
  Object.entries(params).forEach(([key, value]) => {
    resolved = resolved.replace(`:${key}`, value);
  });
  return resolved;
}
