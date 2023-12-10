import { initializeApp } from 'firebase/app';
import { PUBLIC_FIREBASE_CONFIG } from '$env/static/public';
import { getAuth } from 'firebase/auth';

initializeApp(JSON.parse(PUBLIC_FIREBASE_CONFIG));

export const auth = getAuth();
