
console.log('%cWebsite by Juni', 'background: #ff7777; font-weight: bold; padding: 5px; padding-right: 10px; border-radius: 5px; border-top-right-radius: 50%; border-bottom-right-radius: 50%');



function get_postcode_cookie() {
    let code = 'not_found';

    let name = 'postcode=';
    let cookie_list = document.cookie.split(';');
    for(let i = 0; i < cookie_list.length; i++) {
        let c = cookie_list[i];
        if (c.trim().indexOf(name) == 0) {
            code = c.substring(name.length+1, c.length);
            break;
        }
    }

    return code.trim()
}

function cookie_postcode(code) {
    let exdays = 1;
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = 'expires='+ d.toUTCString();
    document.cookie = 'postcode=' + code + ';' + expires + ';path=/';
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



function exit() {
    document.cookie = "postcode=; expires=Thu, 02 Feb 1942 00:00:00 UTC; path=/;";
    document.location.href = './';
}

function back() {
    document.location.href = './post.html';
}

function confirm_postcode() {
    let code = document.getElementById('code_inp').value;

    if (code.length == 4) {
        cookie_postcode(code.toUpperCase())
        document.location.href = './post.html';
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
    for (let member of members) {
        container.innerHTML += `<p>${member}</p>`
    }
}

function update_slider_taskverifier(post_status) {
    let slider = document.getElementById("taskverifier_slider")
    switch (post_status) {
        case "riktig":
            slider.style.background = "var(--check_dark)"
            slider.style.setProperty("--thumb_color", "var(--check_light)");
            slider.value = 0;
            break;

        case "feil":
            slider.value = 2;
            slider.style.background = "var(--cancel_dark)"
            slider.style.setProperty("--thumb_color", "var(--cancel_light)");
            break;

        default:
            slider.style.background = "var(--inp_color)"
            slider.style.setProperty("--thumb_color", "var(--text_c_obscure)");
            break;
    }
}
