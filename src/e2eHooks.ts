import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { getFirebase } from './firebase';

declare global {
  interface Window {
    __e2eSignIn?: (email: string) => Promise<void>;
  }
}

window.__e2eSignIn = async (email: string) => {
  const { auth } = getFirebase();
  const credential = GoogleAuthProvider.credential(
    JSON.stringify({ sub: email, email, email_verified: true }),
  );
  await signInWithCredential(auth, credential);
};
