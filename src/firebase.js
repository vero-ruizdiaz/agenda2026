// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA35NaBaneXHO7fQ4pQokWKTs7U6ekY3MM",
  authDomain: "agenda2026-32ca8.firebaseapp.com",
  databaseURL: "https://agenda2026-32ca8-default-rtdb.firebaseio.com",
  projectId: "agenda2026-32ca8",
  storageBucket: "agenda2026-32ca8.firebasestorage.app",
  messagingSenderId: "339371121654",
  appId: "1:339371121654:web:556cc7476fa959829a85d7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)

// ─── HELPERS DE BASE DE DATOS ─────────────────────────────────────────────────

export async function guardarDoc(coleccion, id, datos) {
  await setDoc(doc(db, coleccion, id), datos)
}

export async function borrarDoc(coleccion, id) {
  await deleteDoc(doc(db, coleccion, id))
}

export async function cargarColeccion(coleccion) {
  const snap = await getDocs(collection(db, coleccion))
  return snap.docs.map(d => ({ ...d.data(), id: d.id }))
}

export function escucharColeccion(coleccion, callback) {
  return onSnapshot(collection(db, coleccion), snap => {
    callback(snap.docs.map(d => ({ ...d.data(), id: d.id })))
  })
}
