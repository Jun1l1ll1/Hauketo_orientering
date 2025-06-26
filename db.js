import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

import { doc, getDoc, updateDoc  } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

const firebase_config = {
    apiKey: 'AIzaSyBg2kBswm2kRPcSsyPoaBsY-kPjuLiquc4',
    authDomain: 'hauketo-orientering.firebaseapp.com',
    projectId: 'hauketo-orientering',
    storageBucket: 'hauketo-orientering.firebasestorage.app',
    messagingSenderId: '736340450825',
    appId: '1:736340450825:web:7e01fc0f29285e445ce2d8',
    measurementId: 'G-RD3X3QDBHP'
};

const app = initializeApp(firebase_config);
const analytics = getAnalytics(app);
const db = getFirestore(app);


export async function verifyACode(acode) {
    const doc_ref = doc(db, 'other', 'admin');
    const doc_snap = await getDoc(doc_ref);
    const data = doc_snap.data()

    return (data.acode == acode);
}

export async function findPost() {
    const code = get_postcode_cookie();
    if (code == 'not_found') return;

    const doc_ref = doc(db, 'posts', code);
    const doc_snap = await getDoc(doc_ref);

    console.log(doc_snap.exists());

    if (doc_snap.exists()) {
        return doc_snap.data();
    } else {
        return;
    }
}

export async function findGroup(nr) {

    const doc_ref = doc(db, 'groups', nr);
    const doc_snap = await getDoc(doc_ref);

    if (doc_snap.exists()) {
        return doc_snap.data();
    } else {
        return;
    }
}


export async function addPostToGroup(postnr, groupnr, current_posts) {

    const group_ref = doc(db, 'groups', groupnr);
    let new_posts = {...current_posts};
    new_posts[postnr] = 'ikke gjort';

    await updateDoc(group_ref, {
        visited_posts: new_posts
    });
}


export async function updateTaskverifier() {
    
    let post_data = await findPost();
    let groupnr = get_group_nr();
    let group_data = await findGroup(groupnr);
    let verifier_value = document.getElementById('taskverifier_slider').value;

    let post_status;
    switch (verifier_value) {
        case '0':
            post_status = 'feil';
            break;
            
        case '2':
            post_status = 'riktig';
            break;
            
        default:
            post_status = 'ikke gjort';
            break;
    }

    update_slider_taskverifier(post_status);

    let updated_posts = {...group_data.visited_posts};
    updated_posts[post_data.post_nr] = post_status;

    const group_ref = doc(db, 'groups', groupnr);
    await updateDoc(group_ref, {
        visited_posts: updated_posts
    });

    
    document.getElementById('taskverifier_title').innerText = 'Post ' + post_data.post_nr + ' - ' + post_status;
}

export async function updateMemberAttendance(checkbox) {
    
    let groupnr = get_group_nr();
    let group_data = await findGroup(groupnr);
    let name = checkbox.id.substring(4);

    let members_data = group_data.members;
    members_data[name] = checkbox.checked;

    const group_ref = doc(db, 'groups', groupnr);
    await updateDoc(group_ref, {
        members: members_data
    });
}
