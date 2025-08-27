import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

import { doc, getDoc, updateDoc, setDoc, collection, getDocs, deleteDoc } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

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
    try {
        const doc_ref = doc(db, 'admin', acode);
        const doc_snap = await getDoc(doc_ref);
        return doc_snap.exists();
    } catch (error) {
        return false;
    }
}

export async function findPost() {
    const code = get_postcode();
    if (code == 'not_found') return;

    const doc_ref = doc(db, 'posts', code);
    const doc_snap = await getDoc(doc_ref);


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


export async function addPostToGroup(postnr, groupnr, current_posts, members) {

    const group_ref = doc(db, 'groups', groupnr);
    let new_posts = {...current_posts};
    new_posts[postnr] = {
        status: 'ikke gjort',
        attendance: members
    };

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
    
    update_slider_taskverifier(post_data.post_nr, post_status);

    let updated_posts = {...group_data.visited_posts};
    updated_posts[post_data.post_nr].status = post_status;

    const group_ref = doc(db, 'groups', groupnr);
    await updateDoc(group_ref, {
        visited_posts: updated_posts
    });

    // document.getElementById('taskverifier_title').innerText = 'Post ' + post_data.post_nr + ' - ' + post_status;
    
}

export async function updateMemberAttendance() {
    
    let groupnr = get_group_nr();
    let group_data = await findGroup(groupnr);

    let visited = group_data.visited_posts;
    let members_data = group_data.members;

    let present_members = [];
    for (const name of members_data) {
        let checked = document.getElementById('mbr_'+name).checked;
        if (checked) {
            present_members.push(name);
        }
    }

    let post_data = await findPost();

    visited[post_data.post_nr].attendance = present_members;

    const group_ref = doc(db, 'groups', groupnr);
    await updateDoc(group_ref, {
        visited_posts: visited
    });
}



export async function newPost() {
    //TODO Fix sync, so it updates when new posts are made, and does not allow creating new post before new post were successfully made

    let new_code, doc_ref, doc_snap;
    do {
        new_code = _generateCode();
        doc_ref = doc(db, 'posts', new_code);
        doc_snap = await getDoc(doc_ref);
    } while (doc_snap.exists()); // Ensuring the code is not already in use

    const coll_ref = collection(db, 'posts');

    let post_nrs = [];
    const query_snapshot = await getDocs(coll_ref);
    query_snapshot.forEach((doc) => {
        post_nrs.push(parseInt(doc.data().post_nr));
    });

    let new_nr = -1;

    post_nrs.sort();
    //* Asumes post numbers start on 1
    if (post_nrs[post_nrs.length-1] == post_nrs.length) new_nr = post_nrs.length+1;
    else {
        for (let i = 0; i < post_nrs.length; i++) {
            if (post_nrs[i] != i+1) {
                new_nr = i+1;
                break;
            }
        }
    }

    await setDoc( doc(coll_ref, new_code), {
        post_nr: new_nr
    });

    let all_posts = await getAllPosts();
    show_all_posts(all_posts);
}

function _generateCode(len = 4) {
    const choices = 'QWERTYUIOPASDFGHJKLZXCVBNM1234567890';

    let code = '';
    for (let i = 0; i < len; i++) {
        let r = Math.floor(Math.random()*(choices.length-1));
        code += choices[r];
    }
    return code;
}


export async function editMembers(group_nr) {
    const names_list = members_inps_to_array();
    if (names_list.length == 0) { return 0 }

    let names_arr = [];
    names_list.forEach(e => {
        let te = e.trim();
        if (te != '') { names_arr.push(te); }
    });

    const coll_ref = collection(db, 'groups');

    if (group_nr != '') {
        const doc_ref = doc(coll_ref, group_nr.toString());
        const doc_snap = await getDoc(doc_ref);

        if (doc_snap.exists()) {
            await updateDoc(doc_ref, {
                members: names_arr
            });

            close_edit_group_members();

            let groups = await getAllGroups()
            show_all_groups(groups)

            return 1;
        }
    }

    let available_id = -1;
    let last_id = 0;

    const query_snapshot = await getDocs(coll_ref);
    query_snapshot.forEach((doc) => {
        if (available_id == -1) { // Only check if none is found yet
            if (last_id+1 < parseInt(doc.id)) { // An ID was skipped
                available_id = last_id+1;
            }
        }
        last_id = parseInt(doc.id);
    });
    if (available_id == -1) { // If no spaces must be filled
        available_id = last_id+1;
    }

    await setDoc( doc(coll_ref, available_id.toString()), {
        members: names_arr,
        visited_posts: {}
    });

    close_edit_group_members();

    let groups = await getAllGroups();
    show_all_groups(groups);
}

export async function removeDoc(coll, document, update=false) {

    await deleteDoc(doc(db, coll, document));

    if (update) {
        switch (coll) {
            case 'groups':
                show_all_groups( await getAllGroups() );
                break;
            
            case 'posts':
                show_all_posts( await getAllPosts() );
                break;
        
            default:
                break;
        }
        
    }
}



export async function getAllGroups() {

    const coll_ref = collection(db, 'groups');
    const query_snap = await getDocs(coll_ref);

    let doc_info = [];
    query_snap.forEach((doc) => {
        doc_info.push({
            nr: doc.id,
            names: doc.data().members
        });
    });

    return doc_info;
}

export async function getAllPosts() {

    const coll_ref = collection(db, 'posts');
    const query_snap = await getDocs(coll_ref);

    let doc_info = [];
    query_snap.forEach((doc) => {
        doc_info.push({
            code: doc.id,
            nr: doc.data().post_nr
        });
    });

    return doc_info;
}

