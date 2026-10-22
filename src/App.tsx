import { useEffect, useRef, useState } from 'react';
import AuthGate from './auth/AuthGate';
import Setup from './pages/Setup';
import Tools from './pages/Tools';
import Upload from './pages/Upload';
import Follower from './slides/Follower';
import Landing from './slides/Landing';
import Presenter from './slides/Presenter';
import { withViewTransition } from './slides/siteNav';
import { parseSiteRoute } from './slides/siteRoute';

function currentRoute(): string {
  const hash = window.location.hash.replace(/^#/, '');
  return hash === '' ? '/' : hash;
}

export default function App() {
  const [route, setRoute] = useState(currentRoute);
  const shown = useRef(route);

  useEffect(() => {
    const onChange = () => {
      const next = currentRoute();
      const from = parseSiteRoute(shown.current);
      const to = parseSiteRoute(next);
      shown.current = next;
      if (from && to && from.section !== to.section) withViewTransition(() => setRoute(next));
      else setRoute(next);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  if (route === '/setup') {
    return <Setup />;
  }
  if (route === '/tools') {
    return <Tools />;
  }
  if (route === '/') {
    return <AuthGate>{() => <Landing />}</AuthGate>;
  }
  const site = parseSiteRoute(route);
  if (site) {
    return <AuthGate>{() => <Follower section={site.section} slideId={site.slideId} />}</AuthGate>;
  }
  if (route === '/presenter') {
    return <AuthGate>{(auth) => <Presenter presenter={auth.presenter} />}</AuthGate>;
  }
  if (route === '/upload') {
    return <AuthGate>{(auth) => <Upload presenter={auth.presenter} />}</AuthGate>;
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-6">
      <div className="text-center">
        <h1 className="mb-4 font-kai text-2xl font-bold">找不到這個頁面</h1>
        <a className="text-ink underline" href="#/">
          回到簡報
        </a>
      </div>
    </main>
  );
}
