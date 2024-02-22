// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB2S_lIBRwa0DSIkcZn4iCaOSwvKll7sic",
  authDomain: "myproject-1bb43.firebaseapp.com",
  projectId: "myproject-1bb43",
  storageBucket: "myproject-1bb43.appspot.com",
  messagingSenderId: "885903375464",
  appId: "1:885903375464:web:efdee02d026b93543b0fdd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getFirestore(app)
export { app, database } 