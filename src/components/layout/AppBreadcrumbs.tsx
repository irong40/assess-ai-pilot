import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';

export function AppBreadcrumbs() {
  const breadcrumbs = useBreadcrumbs();

  if (breadcrumbs.length === 0) {
    return null;
  }

  // On mobile, collapse middle items if more than 3
  const shouldCollapse = breadcrumbs.length > 3;
  const visibleBreadcrumbs = shouldCollapse
    ? [breadcrumbs[0], ...breadcrumbs.slice(-2)]
    : breadcrumbs;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {visibleBreadcrumbs.map((crumb, index) => {
          const isFirst = index === 0;
          const showEllipsis = shouldCollapse && index === 1;

          return (
            <BreadcrumbItem key={crumb.path}>
              {!isFirst && <BreadcrumbSeparator className="hidden sm:block" />}
              
              {showEllipsis && (
                <>
                  <BreadcrumbEllipsis className="hidden sm:flex" />
                  <BreadcrumbSeparator className="hidden sm:block" />
                </>
              )}

              {crumb.isCurrentPage ? (
                <BreadcrumbPage className="max-w-[150px] truncate sm:max-w-none">
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link 
                    to={crumb.path}
                    className="max-w-[100px] truncate sm:max-w-none"
                  >
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
