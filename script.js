
console.log('%cWebsite by Juni', 'background: #ff7777; font-weight: bold; padding: 5px; padding-right: 10px; border-radius: 5px; border-top-right-radius: 50%; border-bottom-right-radius: 50%');



function get_postcode_cookie() {
    let code = '';

    let name = 'postcode=';
    let cookie_list = document.cookie.split(';');
    for(let i = 0; i < cookie_list.length; i++) {
        let c = cookie_list[i];
        if (c.trim().indexOf(name) == 0) {
            code = c.substring(name.length, c.length);
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




function index_loaded() {
    let code = get_postcode_cookie()
    if (code.length == 4) {
        document.location.href = './post.html';
    }
}
function post_page_loaded() {
    let code = get_postcode_cookie()
    if (code == '') {
        document.location.href = './';
    }
}
function group_page_loaded() {
    let code = get_postcode_cookie()
    if (code == '') {
        document.location.href = './';
    }

    const url_params = new URLSearchParams(window.location.search);

    document.getElementById("members_cont")//TODO endre til gruppemedlemmer
    document.getElementById("group_title").innerText = "Gruppe "+url_params.get("nr")
    document.getElementById("taskverifier_title").innerText//TODO endre til postnummer
    document.getElementById("comment_title").innerText = `Kommentar til g${url_params.get("nr")} på pXX`//TODO endre postnummer
    
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
