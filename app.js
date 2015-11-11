var fs     = require('fs'),
tagger = require('./lib/tag.js').tagger;

/* -------------------------------------------------------------- */
// window.ondragover = function (e) { e.preventDefault(); return false; }
// window.ondrop = function (e) { e.preventDefault(); return false; }

var dropzone = document.getElementById('drop-menu');
var ul_files = $('#files');

window.ondragover = function () { dropzone.className = 'hover'; return false; }
dropzone.ondragleave = function () { dropzone.className = ''; return false; }
window.ondrop = function (e) {
    e.preventDefault();

    for (var i = 0; i < e.dataTransfer.files.length; ++i) {
        var file_tag = new tagger(e.dataTransfer.files[i].path);
        var tag = file_tag.ID3V1;
        var tag_e = file_tag.ID3V1_E;

        console.log(e.dataTransfer.files[i].path);
        ul_files.append('<li>'+e.dataTransfer.files[i].name+'</li>');
    }

    dropzone.className = '';
    return false;
}
/* -------------------------------------------------------------- */
