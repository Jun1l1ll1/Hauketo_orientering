
console.log('%cWebsite by Juni', 'background: #ff7777; font-weight: bold; padding: 5px; padding-right: 10px; border-radius: 5px; border-top-right-radius: 50%; border-bottom-right-radius: 50%');



function add_cookie(exdays, name, value) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = 'expires='+ d.toUTCString();
    document.cookie = name + '=' + value + ';' + expires + ';path=/';
}

function get_cookie(name) {
    let code = 'not_found';

    let search = name + '=';
    let cookie_list = document.cookie.split('; ');
    for(let i = 0; i < cookie_list.length; i++) {
        let c = cookie_list[i];
        if (c.trim().indexOf(search) == 0) {
            code = c.substring(search.length, c.length);
            break;
        }
    }
    
    return code.trim();
}



function get_postcode() {
    let code = 'not_found';

    const url_params = new URLSearchParams(window.location.search);
    code = url_params.get('pcode');

    if (code == null || code == 'not_found') {
        code = get_cookie('postcode');
    } else {
        cookie_postcode(code);
    }

    return code;
}

function cookie_postcode(code) {
    add_cookie(1, 'postcode', code.toUpperCase());
}

function cookie_admincode(acode) {
    add_cookie(1, 'admincode', acode.toUpperCase());
}


function get_group_nr() {
    const url_params = new URLSearchParams(window.location.search);
    return url_params.get('nr');
}






function index_loaded() {
    let code = get_postcode()
    if (code.length == 4) {
        document.location.href = './post.html';
    }
}








function toggle_help() {
    let overlay = document.getElementById('help_overlay');
    if (overlay.style.display != 'flex') {
        overlay.style.display = 'flex';
    } else {
        overlay.style.display = 'none';
    }
}






function open_edit_group_members(group_nr='') {
    let cont = document.getElementById('add_post_cont');

    cont.innerHTML = `
        <h4>${group_nr == '' ? 'Legg til ny' : 'Rediger post ' + group_nr}</h4> <br/>
        <p>Skriv inn navn separert med komma:</p>
        <input class="small" type="text" name="add_names_inp" id="add_names_inp" placeholder="Eksempel A., Navn B. C.">
        <button onclick="module.editMembers('${group_nr}')" class="add_btn small">Godkjenn</button>
        <button onclick="close_edit_group_members()" class="cancel_btn small">Cancel</button>
    `;

    if (cont.classList.contains('hide')) {
        cont.classList.remove('hide');
    }
}

function close_edit_group_members() {
    let cont = document.getElementById('add_post_cont');

    if (!cont.classList.contains('hide')) {
        cont.classList.add('hide');
    }
    cont.innerHTML = '';
}






function exit(name='postcode') {
    if (name != '') document.cookie = name+'=; expires=Thu, 02 Feb 1942 00:00:00 UTC; path=/;';

    document.location.href = './';
}

function home() {
    document.location.href = './';
}

function back(location='post') {
    document.location.href = './'+location+'.html';
}

function confirm_postcode() {
    let code = document.getElementById('code_inp').value.toUpperCase();

    if (code.length == 4) {
        cookie_postcode(code);
        document.location.href = './post.html';
    }
}

function confirm_admincode() {
    if (get_cookie('admincode') != 'not_found') {
        document.location.href = './admin.html';
    }

    let acode = document.getElementById('admin_code_inp').value.toUpperCase();

    if (acode.length == 4 && acode[0] == 'A') {
        cookie_admincode(acode);
        document.location.href = './admin.html';
    }
}

function enter_group() {
    let groupnr = document.getElementById('group_inp').value;

    if (groupnr.length > 0) {
        document.location.href = './group.html?nr='+groupnr;
    }
}





function show_members(members) {
    let container = document.getElementById("members_cont")
    container.innerHTML = "";
    for (let [member, present] of Object.entries(members)) {
        container.innerHTML += `
        <div>
            <input onclick="module.updateMemberAttendance(this)" id="mbr_${member}" type="checkbox" ${present ? 'checked' : ''}>
            <label for="mbr_${member}">${member}</label>
        </div>
        `
    }
}

function update_slider_taskverifier(post_status) {
    let slider = document.getElementById("taskverifier_slider");
    switch (post_status) {
        case "feil":
            slider.value = 0;
            slider.style.background = "var(--cancel_dark)";
            slider.style.setProperty("--thumb_color", "var(--cancel_light)");
            break;

        case "riktig":
            slider.style.background = "var(--check_dark)";
            slider.style.setProperty("--thumb_color", "var(--check_light)");
            slider.value = 2;
            break;

        default:
            slider.style.background = "var(--inp_color)";
            slider.style.setProperty("--thumb_color", "var(--text_c_obscure)");
            break;
    }
}
