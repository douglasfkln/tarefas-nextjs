import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC8NJEzE-MnLtBAZvZ3MsJz3SIkK5PLbFA",
  authDomain: "tarefas-nestjs.firebaseapp.com",
  projectId: "tarefas-nestjs",
  storageBucket: "tarefas-nestjs.appspot.com",
  messagingSenderId: "490124539896",
  appId: "1:490124539896:web:26c67e9831f9a6fae6480d"
};

const firebaseApp = initializeApp(firebaseConfig);

const db = getFirestore(firebaseApp)

export { db };