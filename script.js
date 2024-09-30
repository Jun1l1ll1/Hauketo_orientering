
console.log('%cWebsite by Juni', 'background: #ff7777; font-weight: bold; padding: 5px; padding-right: 10px; border-radius: 5px; border-top-right-radius: 50%; border-bottom-right-radius: 50%');



function page_loaded() {
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
    
    if (code == '') {
        document.location.href = './';
    }
}
function index_loaded() {
    let code = '';

    let name = 'postcode=';
    let cookie_list = document.cookie.split(';');
    for(let i = 0; i < cookie_list.length; i++) {
        let c = cookie_list[i];
        if (c.trim().indexOf(name) == 0) {
            code = c.substring(name.length+1, c.length);
            break;
        }
    }
    if (code.trim().length == 4) {
        document.location.href = './enter_group.html';
    }
}





function cookie_postcode(code) {
    let exdays = 1;
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = 'expires='+ d.toUTCString();
    document.cookie = 'postcode=' + code + ';' + expires + ';path=/';
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


function confirm_postcode() {
    let code = document.getElementById('code_inp').value;

    if (code.length == 4) {
        cookie_postcode(code.toUpperCase())
        document.location.href = './enter_group.html';
    }
}
