const sections: Record<string, string> = {city:'/', 'city-news':'/magazine', 'city-outings':'/outings', 'city-sports':'/sports', 'city-places':'/places', 'city-events':'/events', 'city-services':'/services', 'city-businesses':'/businesses', home:'/transport', directory:'/transport/lines', map:'/map', saved:'/saved', profile:'/account', admin:'/admin', editorial:'/editorial'};
export function routeHref(route: string): string {
  for (const [prefix, path] of [['news:', '/read/'], ['tag:', '/tag/'], ['author:', '/author/'], ['category:', '/category/'], ['search:', '/search/']]) {
    if (route.startsWith(prefix)) return path + encodeURIComponent(route.slice(prefix.length));
  }
  return sections[route] || '/404';
}
export function readRoute(pathname: string): string {
  const path = pathname.replace(/\/+$/, '') || '/';
  const section = Object.entries(sections).find(([, url]) => url === path);
  if (section) return section[0];
  for (const [prefix, route] of [['/read/', 'news:'], ['/tag/', 'tag:'], ['/author/', 'author:'], ['/category/', 'category:'], ['/search/', 'search:']]) {
    if (path.startsWith(prefix)) {
      try { const id = decodeURIComponent(path.slice(prefix.length)); return id && !id.includes('/') ? route + id : 'not-found'; } catch { return 'not-found'; }
    }
  }
  return 'not-found';
}
