type RouteHandler = (params: Record<string, string>) => void;

interface Route {
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

class Router {
  private routes: Route[] = [];

  on(path: string, handler: RouteHandler): void {
    // Convert path like "/day/:date" to regex
    const paramNames: string[] = [];
    const regexStr = path.replace(/:(\w+)/g, (_match, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    this.routes.push({
      pattern: new RegExp(`^${regexStr}$`),
      paramNames,
      handler,
    });
  }

  start(): void {
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  }

  navigate(path: string): void {
    window.location.hash = path;
  }

  private resolve(): void {
    const hash = window.location.hash.slice(1) || '/';

    for (const route of this.routes) {
      const match = hash.match(route.pattern);
      if (match) {
        const params: Record<string, string> = {};
        route.paramNames.forEach((name, i) => {
          params[name] = match[i + 1];
        });
        route.handler(params);
        return;
      }
    }

    // Default: go to chart
    this.navigate('/');
  }
}

export const router = new Router();
