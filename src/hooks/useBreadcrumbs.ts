import { useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { BREADCRUMB_CONFIG, matchRoute, resolvePattern } from '@/config/breadcrumbs';
import { SECURITY_DOMAINS } from '@/types/questionnaire';

export interface BreadcrumbItem {
  label: string;
  path: string;
  isCurrentPage: boolean;
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const location = useLocation();
  const params = useParams();

  return useMemo(() => {
    const pathname = location.pathname;
    const matched = matchRoute(pathname);

    if (!matched) {
      return [];
    }

    const { pattern, params: routeParams } = matched;
    const breadcrumbs: BreadcrumbItem[] = [];

    // Build breadcrumb trail by traversing parent relationships
    let currentPattern: string | null = pattern;
    const trail: Array<{ pattern: string; config: typeof BREADCRUMB_CONFIG[string] }> = [];

    while (currentPattern && BREADCRUMB_CONFIG[currentPattern]) {
      const config = BREADCRUMB_CONFIG[currentPattern];
      trail.unshift({ pattern: currentPattern, config });
      currentPattern = config.parent;
    }

    // Convert trail to breadcrumb items with resolved paths and labels
    trail.forEach((item, index) => {
      const isLast = index === trail.length - 1;
      const resolvedPath = resolvePattern(item.pattern, routeParams);
      let label = item.config.label;

      // Dynamic label resolution
      if (item.pattern === '/assessment/:id' || item.pattern === '/assessment/:id/wizard') {
        // Could fetch assessment name here, for now use shortened ID
        if (routeParams.id) {
          const shortId = routeParams.id.substring(0, 8);
          if (item.pattern === '/assessment/:id') {
            label = `Assessment ${shortId}`;
          }
        }
      }

      if (item.pattern === '/assessment/:id/wizard/:domainId' && routeParams.domainId) {
        const domain = SECURITY_DOMAINS.find(d => d.id === routeParams.domainId);
        if (domain) {
          label = domain.name;
        }
      }

      breadcrumbs.push({
        label,
        path: resolvedPath,
        isCurrentPage: isLast,
      });
    });

    return breadcrumbs;
  }, [location.pathname, params]);
}
