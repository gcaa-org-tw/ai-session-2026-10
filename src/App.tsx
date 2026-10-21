import { useEffect, useState } from 'react';
import AuthGate from './auth/AuthGate';
import Follower from './slides/Follower';
import Presenter from './slides/Presenter';

function currentRoute(): string {
  const hash = window.location.hash.replace(/^#/, '');
  return hash === '' ? '/' : hash;
}

export default function App() {
  const [route, setRoute] = useState(currentRoute);

  useEffect(() => {
    const onChange = () => setRoute(currentRoute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  if (route === '/') {
    return <AuthGate>{() => <Follower />}</AuthGate>;
  }
  if (route === '/presenter') {
    return <AuthGate>{(auth) => <Presenter presenter={auth.presenter} />}</AuthGate>;
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold">找不到這個頁面</h1>
        <a className="text-emerald-700 underline" href="#/">
          回到簡報
        </a>
      </div>
    </main>
  );
}
