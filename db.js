import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

import { doc, getDoc, updateDoc  } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebase_config = {
    apiKey: "AIzaSyBg2kBswm2kRPcSsyPoaBsY-kPjuLiquc4",
    authDomain: "hauketo-orientering.firebaseapp.com",
    projectId: "hauketo-orientering",
    storageBucket: "hauketo-orientering.firebasestorage.app",
    messagingSenderId: "736340450825",
    appId: "1:736340450825:web:7e01fc0f29285e445ce2d8",
    measurementId: "G-RD3X3QDBHP"
};

const app = initializeApp(firebase_config);
const analytics = getAnalytics(app);
const db = getFirestore(app);


export async function findPost() {
    const doc_ref = doc(db, "posts", get_postcode_cookie());
    const doc_snap = await getDoc(doc_ref);

    if (doc_snap.exists()) {
        return doc_snap.data();
    } else {
        return;
    }
}

export async function findGroup(nr) {
    const doc_ref = doc(db, "groups", nr);
    const doc_snap = await getDoc(doc_ref);

    if (doc_snap.exists()) {
        return doc_snap.data();
    } else {
        return;
    }
}


export async function addPostToGroup(postnr, groupnr, current_posts) {
    const group_ref = doc(db, "groups", groupnr);
    let new_posts = {...current_posts};
    new_posts[postnr] = "uncompleted";

    await updateDoc(group_ref, {
        visited_posts: new_posts
    });
}
