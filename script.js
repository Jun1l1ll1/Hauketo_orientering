
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
    let cookie_list = document.cookie.split(';');
    for(let i = 0; i < cookie_list.length; i++) {
        let c = cookie_list[i];
        if (c.trim().indexOf(search) == 0) {
            code = c.substring(search.length, c.length);
            break;
        }
    }

    console.log(cookie_list)
    return code.trim();
}



function get_postcode_cookie() {
    return get_cookie('postcode');
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
    let code = get_postcode_cookie()
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



function exit(remove_cookie=true, name='postcode') {
    if (remove_cookie) document.cookie = name+'=; expires=Thu, 02 Feb 1942 00:00:00 UTC; path=/;';

    document.location.href = './';
}

function back() {
    document.location.href = './post.html';
}

function confirm_postcode() {
    let code = document.getElementById('code_inp').value.toUpperCase();

    if (code.length == 4) {
        cookie_postcode(code);
        document.location.href = './post.html';
    }
}

function confirm_admincode() {
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
    console.log(members);
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
