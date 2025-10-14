import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js';
import { 
    getFirestore,
    doc, 
    getDoc, 
    updateDoc, 
    setDoc, 
    collection, 
    getDocs, 
    deleteDoc,
    deleteField,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';

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
const db = getFirestore(app);
const analytics = getAnalytics(app);
let auth = getAuth(app);

let unsub_groups, unsub_posts;

export async function index_auth(from = 'params') {

    let email, password;

    if (from == 'login') {
        email = document.getElementById('user_login_inp').value;
        password = document.getElementById('pword_login_inp').value;
    } else {
        const url_params = new URLSearchParams(window.location.search);
        email = url_params.get('u');
        password = url_params.get('p');
    }

   onAuthStateChanged(auth, (user) => {
        if (user) {
            // Bruker er allerede logget inn 
            document.getElementById('postcode_cont').classList.remove('hide');
            document.getElementById('login_cont').classList.add('hide');
            return;

        } else {
            // Prøv å logge inn bruker
            try {
                if (email == null || password == null) throw 0;
                user_cred = signInWithEmailAndPassword(auth, email, password);
            } catch(err) {
                // Feil innlogging
                console.warn('Login error,', err);
                document.getElementById('login_cont').classList.remove('hide');
                document.getElementById('postcode_cont').classList.add('hide');
                return;
            }
        
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    // Logget inn!
                    return;
                } else {
                    // Feil oppsto
                    document.getElementById('login_cont').classList.remove('hide');
                    document.getElementById('postcode_cont').classList.add('hide');  
                    return;
                }
            });
        }
    });
}

async function authenticate(email, pword) {
    try {
        await signInWithEmailAndPassword(auth, email, pword);
    } catch(err) {
        return false;
    }

    await onAuthStateChanged(auth, (user) => {
        if (user) {
            // Logget inn!
            return true;
        } else {
            // Feil oppsto
            return false;
        }
    });
    // Func returnerer undefined så lenge signInWithEmailAndPassword ikke feiler
    // (så onAuthStateChanged sin returverdi ignoreres tror jeg...)
}

export async function verifyACode(acode) {
    try {
        const doc_ref = doc(db, 'codes', acode);
        const doc_snap = await getDoc(doc_ref);
        
        if (doc_snap.data().type != "admincode") return false;
        return doc_snap.exists();
    } catch (error) {
        return false;
    }
}

export async function verifyTCode(tcode) {
    try {
        const doc_ref = doc(db, 'codes', tcode);
        const doc_snap = await getDoc(doc_ref);
        
        if (doc_snap.data().type != "timercode") return false;
        return doc_snap.exists();
    } catch (error) {
        return false;
    }
}


export async function updateAdminView() {
    let all_groups = [];
    let all_posts = [];

    const coll_ref_groups = collection(db, "groups");
    unsub_groups = onSnapshot(coll_ref_groups, (snapshot) => {
        all_groups = [];
        snapshot.forEach((doc) => {
            let data = doc.data();

            let visit = {};
            for (const postnr of Object.keys(data.visited_posts)) {
                visit[postnr] = data.visited_posts[postnr].status
            }

            all_groups.push({
                nr: doc.id,
                names: data.members,
                grade: data.numberset,
                visited: visit,
                time: [(data.time_start ? true : false), (data.time_stop ? true : false)]
            });
        });
        all_groups.sort((a, b) => a.nr - b.nr);
        show_group_overview(all_groups, all_posts);
    });
    
    const coll_ref_posts = collection(db, "posts");
    unsub_posts = onSnapshot(coll_ref_posts, (snapshot) => {
        all_posts = [];
        snapshot.forEach((doc) => {
            all_posts.push({
                code: doc.id,
                nr: doc.data().post_nr
            });
        });
        all_posts.sort((a, b) => a.nr - b.nr);
        show_group_overview(all_groups, all_posts);
    });
}

export function exitAdminView(full_exit = false) {
    if (unsub_groups) unsub_groups();
    if (unsub_posts) unsub_posts();

    if (full_exit) {
        exit('admincode');
    } else {
        back('admin');
    }
}


export async function findPost() {
    const code = get_postcode();
    if (code == 'not_found') return;

    const doc_ref = doc(db, 'posts', code);
    let doc_snap;
    try {
        doc_snap = await getDoc(doc_ref);
    } catch (err) {
        if (!auth.currentUser) {const url_params = new URLSearchParams(window.location.search);
            let email = url_params.get('u');
            let password = url_params.get('p');
            if (email == null || password == null) return;

            let auth = await authenticate(email, password);
            if (auth == false) return;

            doc_snap = await getDoc(doc_ref);
        } else {
            return;
        }
    }

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


export async function editGroupNumSet() {
    let name = document.getElementById('numset_edit_name').value;
    let from = parseInt(document.getElementById('numset_edit_from').value);
    let to = parseInt(document.getElementById('numset_edit_to').value);

    if (name == '' || !from || from < 1 || to < from) return;
    
    const doc_ref = doc(db, 'other', 'group_nr');
    const doc_snap = await getDoc(doc_ref);
    let n_sets;
    if (doc_snap.exists()) {
        n_sets = doc_snap.data().sets;
        n_sets[name] = [from, to];

        await updateDoc(doc_ref, {
            sets: n_sets
        });
    }

    close_edit_numset();
    show_numsets(n_sets);
}


export async function openEditGroup(group_nr='', members=null, numset_key='') {
    let numsets = await getAllGroupNumSets();
    open_edit_group_members(numsets, group_nr, members, numset_key);
}

export async function editMembers(group_nr, with_numset=false) {
    const names_list = members_inps_to_array();
    if (names_list.length == 0) { return 0 }

    let names_arr = [];
    names_list.forEach(e => {
        let te = e.trim();
        if (te != '') { names_arr.push(te); }
    });

    const coll_ref = collection(db, 'groups');

    //* Update existing group
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

    //* New group
    let from = 0; // 1 less than lowes possible nr
    let to = -1; // -1: no hight cap

    let numset_key = '';
    if (with_numset) {
        numset_key = document.getElementById('edit_group_choose_numset_select').value;

        const doc_ref = doc(db, 'other', 'group_nr');
        const doc_snap = await getDoc(doc_ref);

        if (doc_snap.exists()) {
            let this_set = doc_snap.data().sets[numset_key];
            from = this_set[0] - 1;
            if (this_set[1] && this_set[1] > 0) to = this_set[1];
        }
    }

    let current_nr = from;
    let doc_snap
    do {
        current_nr ++;
        if (to > 0 && current_nr > to) {
            console.warn('No available group number.')
            return 0; //TODO? Add note in HTML asking to change number set
        }
        
        doc_snap = await getDoc( doc(coll_ref, current_nr.toString()) );
    } while (doc_snap.exists());

    await setDoc( doc(coll_ref, current_nr.toString()), {
        members: names_arr,
        numberset: numset_key,
        visited_posts: {}
    });

    close_edit_group_members();

    let groups = await getAllGroups();
    show_all_groups(groups);

    return 1;
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



export async function timer(now) {
    let group_nr = document.getElementById('timer_grnr_span').innerText;
    if (group_nr == 'XXX') return;

    let chckbx = document.getElementById('timer_start_stop_switch');
    let edit_stop = chckbx.checked;

    let date = new Date();
    let time;
    if (now) {
        time = date;
    } else {
        let l = document.getElementById('timer_custom').value.split(':');
        if (l.length != 2) return;
        time = new Date(date.getFullYear(), date.getMonth(), date.getDate(), l[0], l[1]);
    }

    const doc_ref = doc(db, 'groups', group_nr);
    const doc_snap = await getDoc(doc_ref);

    if (doc_snap.exists()) {
        let d = doc_snap.data();
        if (edit_stop) {
            if (d.time_stop) {
                if (!confirm('Er du sikker på at du vil overskrive nåværende sluttid?')) return;
            }
            await updateDoc(doc_ref, {
                time_stop: time
            });
        } else {
            if (d.time_start) {
                if (!confirm('Er du sikker på at du vil overskrive nåværende starttid?')) return;
            }
            await updateDoc(doc_ref, {
                time_start: time
            });
        }
    }
    
    if (!edit_stop) {
        swap_timer_edit(true, true);
    }

    await updateStartAndStopTimer(group_nr)
}

export async function removeTime(time) {
    if (!['start', 'stop'].includes(time)) return;
    
    let group_nr = document.getElementById('timer_grnr_span').innerText;
    if (group_nr == 'XXX') return;

    const doc_ref = doc(db, 'groups', group_nr);
    const doc_snap = await getDoc(doc_ref);

    if (doc_snap.exists()) {
        if (time == 'start') {
            await updateDoc(doc_ref, {
                time_start: deleteField()
            });
        } else {
            await updateDoc(doc_ref, {
                time_stop: deleteField()
            });
        }
    }

    await updateStartAndStopTimer(group_nr);
}

export async function timerGetGroup() {
    let group_nr = document.getElementById('group_inp').value;
    if (group_nr == '') return;

    await updateStartAndStopTimer(group_nr);

    for (const elem of document.getElementsByClassName('timer_hide_when_group')) {
        elem.classList.add('hide');
    }
    for (const elem of document.getElementsByClassName('timer_show_when_group')) {
        elem.classList.remove('hide');
    }
}

async function updateStartAndStopTimer(group_nr) {
    const doc_ref = doc(db, 'groups', group_nr);
    const doc_snap = await getDoc(doc_ref);

    if (doc_snap.exists()) {
        let data = doc_snap.data();
        document.getElementById('timer_grnr_span').innerText = group_nr;
        document.getElementById('timer_group_members').innerText = `(${data.members.join(', ')})`;

        let strt = document.getElementById('timer_start');
        let stp = document.getElementById('timer_stop');

        if (data.time_start) {
            let strt_date = data.time_start.toDate();
            strt.childNodes[1].innerText = (strt_date.getHours() <= 9 ? '0' : '') + strt_date.getHours() + ':' + (strt_date.getMinutes() <= 9 ? '0' : '') + strt_date.getMinutes();
            strt.classList.remove('hide');

            swap_timer_edit(true, true);
        } else {
            strt.classList.add('hide');
            swap_timer_edit(true, false);
        }

        if (data.time_stop) {
            let stp_date = data.time_stop.toDate();
            stp.childNodes[1].innerText = (stp_date.getHours() <= 9 ? '0' : '') + stp_date.getHours() + ':' + (stp_date.getMinutes() <= 9 ? '0' : '') + stp_date.getMinutes();
            stp.classList.remove('hide');
        } else {
            stp.classList.add('hide');
        }
    }
}



export async function getAllGroupNumSets() {

    const doc_ref = doc(db, 'other', 'group_nr');
    const doc_snap = await getDoc(doc_ref);

    if (doc_snap.exists()) {
        return doc_snap.data().sets;
    }

    return
}

export async function getAllGroups() {

    const coll_ref = collection(db, 'groups');
    const query_snap = await getDocs(coll_ref);

    let doc_info = [];
    query_snap.forEach((doc) => {
        let data = doc.data();

        let visit = {};
        for (const postnr of Object.keys(data.visited_posts)) {
            visit[postnr] = data.visited_posts[postnr].status
        }

        doc_info.push({
            nr: doc.id,
            names: data.members,
            grade: data.numberset,
            visited: visit
        });
    });

    doc_info.sort((a, b) => a.nr - b.nr);

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
    
    doc_info.sort((a, b) => a.nr - b.nr);

    return doc_info;
}







export async function setExportDataGroups() {
    let cont = document.getElementById('result_group_export_table');

    let html = `
    <tr>
        <th>Gruppe</th>
        <th>Klasse</th>
        <th>Starttid</th>
        <th>Sluttid</th>
        <th>Tot. tid m tillegg (min)</th>
        <th>Ant. besvarte poster</th>
        <th>Rette</th>
        <th>Feil</th>
    </tr>`;

    const coll_ref = collection(db, 'groups');
    const query_snap = await getDocs(coll_ref);

    let data, correct, wrong, start, stop, total_time;
    query_snap.forEach((doc) => {
        data = doc.data();

        correct = 0; wrong = 0;
        for (const visited of Object.values(data.visited_posts)) {
            if (visited.status == 'riktig') correct++;
            else if (visited.status == 'feil') wrong++;
        }

        start = 'Aldri';
        if (data.time_start) {
            let strt_d = data.time_start.toDate();
            start = 'kl. ' + (strt_d.getHours() <= 9 ? '0' : '') + strt_d.getHours() + ':' + (strt_d.getMinutes() <= 9 ? '0' : '') + strt_d.getMinutes();
        }

        stop = 'Aldri';
        if (data.time_stop) {
            let stp_d = data.time_stop.toDate();
            stop = 'kl. ' + (stp_d.getHours() <= 9 ? '0' : '') + stp_d.getHours() + ':' + (stp_d.getMinutes() <= 9 ? '0' : '') + stp_d.getMinutes();
        }

        total_time = '';
        if (data.time_start && data.time_stop) {
            let min_per_wrong = parseInt( document.getElementById('result_time_penalty_inp').value );

            let t_sec = data.time_stop.seconds - data.time_start.seconds;
            t_sec += min_per_wrong*60 * wrong; // min_per_wrong minutter tillegg per feil

            total_time = Math.ceil(t_sec/60);
        }

        html += `
        <tr>
            <td>${doc.id}</td>
            <td>${data.numberset != 'Ekstra' ? data.numberset : ''}</td>
            <td>${start}</td>
            <td>${stop}</td>
            <td>${total_time}</td>
            <td>${correct+wrong}</td>
            <td>${correct}</td>
            <td>${wrong}</td>
        </tr>`;
    });

    cont.innerHTML = html;
}


export async function setExportDataIndividual() {
    let cont = document.getElementById('result_individual_export_table');
    
    let html = `
    <tr>
        <th>Navn</th>
        <th>Klasse</th>
        <th>Gruppe</th>
        <th>Ant. besvarte poster</th>
        <th>Rette</th>
        <th>Feil</th>
    </tr>`;

    const coll_ref = collection(db, 'groups');
    const query_snap = await getDocs(coll_ref);

    let data, correct, wrong, namelist;
    query_snap.forEach((doc) => {
        data = doc.data();

        for (const name of data.members) {
            
            correct = 0; wrong = 0;
            for (const visited of Object.values(data.visited_posts)) {
                if (visited.status == 'riktig' && visited.attendance.includes(name)) correct++;
                else if (visited.status == 'feil' && visited.attendance.includes(name)) wrong++;
            }

            html += `
            <tr>
                <td>${name}</td>
                <td>${data.numberset != 'Ekstra' ? data.numberset : ''}</td>
                <td>${doc.id}</td>
                <td>${correct+wrong}</td>
                <td>${correct}</td>
                <td>${wrong}</td>
            </tr>`;
        }
    });

    cont.innerHTML = html;
}

