var S_PAUSE = '/p/';
var S_RESUME = '/r/';
var S_NEWLINE = '/n/';
var S_POP = '//';
var isClear = true;

var CMDTEXT={};
CMDTEXT[S_PAUSE] = 'Pause';
CMDTEXT[S_RESUME] = 'Resume';
CMDTEXT[S_NEWLINE] = 'Next line';
CMDTEXT[S_POP] = 'Close last open tag';

var COMMAND= {
    PAUSE: "pause",
    RESUME: "resume",
    NEWLINE: "newline",
    POP:"pop",
    NONE:"none"
}

$(function () {
    window.tagArray = [];
    window.textSource = '';
    $(".resizable")
      .wrap('<div/>')
        .css({ 'overflow': 'hidden' })
          .parent()
            .css({
                'display': 'inline-block',
                'overflow': 'hidden',
                'height': function () { return $('.resizable', this).height(); },
                'width': function () { return $('.resizable', this).width(); },
                'paddingBottom': '12px',
                'paddingRight': '12px'

            }).resizable()
                    .find('.resizable')
                      .css({
                          overflow: 'auto',
                          width: '100%',
                          height: '100%'
                      });
});

//Source: http://stackoverflow.com/questions/1219860/html-encoding-in-javascript-jquery

function htmlEncode(value) {
    //create a in-memory div, set it's inner text(which jQuery automatically encodes)
    //then grab the encoded contents back out.  The div never exists on the page.
    return $('<div/>').text(value).html();
}

function getVideoIDFromURL(url) {
    return url.split('v=')[1].split('&')[0];
}

function htmlDecode(value) {
    return $('<div/>').html(value).text();
}

function loadVideo(e) {
    if (e.keyCode === 13) {
        loadVideoURL();
        return false;
    }
}

function loadVideoURL() {
    var tb = document.getElementById("tbURL");
    var videoid = tb.value.split('v=')[1].split('&')[0];
    player.loadVideoById(videoid);
    clearPage();
}

function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function replaceAll(string, find, replace) {
    return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function clearPage() {
    $("#pnlNotes").html('');
    $("#txtSource").text('');
    $("#tbNotes").html('');
    isClear = true;
}

function convertSourceToOutput(sourceText, includeVideo) {
    var playerHTML = '';
    if (includeVideo) {
        var videoID = getVideoIDFromURL(player.getVideoUrl());
        var scriptHTML = '<div id="player"></div><script>var tag=document.createElement("script");tag.src="https://www.youtube.com/iframe_api";var firstScriptTag=document.getElementsByTagName("script")[0];firstScriptTag.parentNode.insertBefore(tag,firstScriptTag);var player;function onYouTubeIframeAPIReady(){player=new YT.Player("player",{height:"390",width:"640",videoId:"' + videoID + '",playerVars:{autostart:0,autoplay:0,controls:1},events:{onReady:onPlayerReady,onStateChange:onPlayerStateChange}})}function onPlayerReady(a){}var done=!1;function onPlayerStateChange(a){}function playVideo(){player.playVideo()}function pauseVideo(){player.pauseVideo()}function stopVideo(){player.stopVideo()}function loadVideoById(a){player.loadVideoById(a,0,"large")}function playVideoAt(pos){player.seekTo(parseFloat(pos))};</script>';
        var htmlInfo = '<br/><b>Click on text below to jump to specific point in the video</b>';
        playerHTML = scriptHTML+htmlInfo;
    }
    var allText = sourceText;
    var lines = allText.split("{|");
    var html = '';
    var htmlPre = '<span>';
    var startScopedStyle = '<style scoped>';
    var clickableStyle = '.clickable{cursor:pointer;cursor:hand;}.clickable:hover{background:yellow;}';
    var style = clickableStyle+ $("#txtCSS").val();
    var endScopedStyle = '</style>';
    var htmlPost = '</span>';
    var htmlFromSource = '';
    $.each(lines, function (index, value) {
        if (value.trim() !== '') {
            var location = parseFloat(value.split("|")[0]);
            var lineText = value.split("|")[1].split("|}")[0];
            var htmlRaw = lineText;
            if (lineText === '/n/') {
                htmlRaw = '<br/>';
            }
            else if (lineText.charAt(0)==='/'&&lineText.charAt(lineText.length-1)==='/') {
                var insideText = lineText.substring(1, lineText.length - 1);
                var tagName = insideText;
                var tagValue = '';
                if (insideText.indexOf('/') > -1) {
                    tagName = insideText.split('/')[0];
                    tagValue = insideText.split('/')[1];
                    htmlRaw = '<span class="' + tagName + '">'+tagValue+'</span>';
                } else {
                    htmlRaw = '<span class="' + tagName + '">';
                }
            }
            htmlRaw = replaceAll(htmlRaw, '/n/', '<br/>');
            htmlFromSource += '<span class="clickable" onclick="playVideoAt('+location+')">'+ htmlRaw+'</span>';
        }
    });
    htmlFromSource = '<div style="height:300px;overflow:auto" class="resizable">' + htmlFromSource + '</div>';
    html = htmlPre + playerHTML+ startScopedStyle + style + endScopedStyle + htmlFromSource + htmlPost;
    return html;
}

String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

String.prototype.replaceAt = function (index, character) {
    return this.substr(0, index) + character + this.substr(index + character.length);
}

function keyUpEvent(e) {
    var tb = document.getElementById("tbNotes");
    var text = tb.value;
    if (text.endsWith('/p//')) {
        player.pauseVideo();
        tb.value = text.slice(0, -4);
    }
    if (text.endsWith('/r//')) {
        player.playVideo();
        tb.value = text.slice(0, -4);
    }
    if (text.length === 1 && isClear) {
        window.currPosition = player.getCurrentTime();
        $("#spnNextJot").text('Next jot at position ' + window.currPosition + ' s');
        isClear = false;
    }
    var command = getCommand(text);
    if (command === COMMAND.PAUSE) {
        $("#spnAlert").text(CMDTEXT[S_PAUSE]);
    }
    else if (command === COMMAND.RESUME) {
        $("#spnAlert").text(CMDTEXT[S_RESUME]);
    }
    else if (command === COMMAND.NEWLINE) {
        $("#spnAlert").text(CMDTEXT[S_NEWLINE]);
    }
        else if (command === COMMAND.POP) {
        $("#spnAlert").text(CMDTEXT[S_POP]);
    }
    else if (text.charAt(0) === '/' && text.charAt(text.length - 1) === '/') {
            //rewind if - number
            //forward if + number
            var inside = text.substring(1, text.length - 1);
            var rewind = TryParseInt(inside, null);
            if (rewind) {
                if (rewind > 0) {
                    $("#spnAlert").text('Forward ' + rewind + ' seconds');
                } else {
                    $("#spnAlert").text('Back ' + Math.abs(rewind) + ' seconds');
                }
            } 
        }
    else {
        $("#spnAlert").text('');
    }
    return false;
}

function getCommand(text) {
    var command = COMMAND.NONE;
    if (text === S_PAUSE) {
        command = COMMAND.PAUSE;
    }
    else if (text === S_RESUME) {
        command = COMMAND.RESUME;
    }
    else if (text === S_NEWLINE) {
        command = COMMAND.NEWLINE;
    }
    else if (text === S_POP) {
        command = COMMAND.POP;
    }
    return command;
}

function addToSource(text, position) {
    window.textSource += '{|'+position+'|' + text + '|}';
    $("#txtSource").text(window.textSource);
}

function keyPressEvent(e) {
    var tb = document.getElementById("tbNotes");
    var text = tb.value;
    var textToDisplay = text;
    var sourceText = text;
    if (e.keyCode === 13) {
        var command = getCommand(text);
        var doNotDisplay = false;
        if (command === COMMAND.POP) {
            //pop last tag from array
            window.tagArray.remove(window.tagArray.length - 1);
            doNotDisplay = true;
            displayTagArray();
        } else if (command === COMMAND.PAUSE) {
            player.pauseVideo();
            doNotDisplay = true;
        }
        else if (command === COMMAND.RESUME) {
                player.playVideo();
                doNotDisplay = true;
        }
        else if (command === COMMAND.NEWLINE) {
            
        }
        else if (text.charAt(0) === '/' && text.charAt(text.length - 1) !== '/') {
            var nonSlashFound = false;
            sourceText = text;
            var slashString = '';
            var numSlashes = 0;
            for (var i = 0; i < text.length; i++) {
                if (text.charAt(i) === '/') {
                    if (!nonSlashFound) {
                        slashString += '/n/';
                        numSlashes += 1;
                    }
                } else {
                    nonSlashFound = true;
                }
            }
            sourceText = slashString + text.substring(numSlashes, text.length);
            //sourceText = '/n/'+ text.substring(1, text.length);
        }
        else {
            if (text.charAt(0) === '/' && text.charAt(text.length - 1) === '/') {
                //rewind if - number
                //forward if + number
                var inside = text.substring(1, text.length - 1);
                var rewind = TryParseInt(inside, null);
                if (rewind) {
                    player.seekTo(player.getCurrentTime() + rewind);
                    doNotDisplay = true;
                } else {
                    var tagName = inside;
                    if (inside.indexOf('/') > -1) {
                        //a closed, but filled out tag
                        var tagValue = inside.substring(inside.indexOf('/') + 1);
                        textToDisplay = tagValue;
                    } else {
                        window.tagArray.push(tagName);
                        //textToDisplay = '';
                    }
                    displayTagArray();
                }
            }
        }
        if (!doNotDisplay && textToDisplay.trim() !== '') {
            addToSource(htmlEncode(sourceText), window.currPosition);
            var output = convertSourceToOutput($("#txtSource").text(), false);
            var outputWithPlayer = convertSourceToOutput($("#txtSource").text(), true);
            $("#pnlNotes").html(output);
            $("#viewoutput").html(output);
            $("#txtOutputHTML").text(outputWithPlayer);
        }
        tb.value = '';
        isClear = true;
        $("#spnNextJot").text('');
        return false;
    }
}

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function (from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

function displayTagArray() {
    $("#tagArray").html('&nbsp;');
    $.each(window.tagArray, function(index, value) {
        $("#tagArray").append(value+' > ');
    });
}

function TryParseInt(str, defaultValue) {
    var retValue = defaultValue;
    if (str !== null) {
        if (str.length > 0) {
            if (!isNaN(str)) {
                retValue = parseInt(str);
            }
        }
    }
    return retValue;
}

$(function () {
    function Menu(cutLabel, copyLabel, pasteLabel) {
        var gui = require('nw.gui')
          , menu = new gui.Menu()

          , cut = new gui.MenuItem({
              label: cutLabel || "Cut"
            , click: function () {
                document.execCommand("cut");
                console.log('Menu:', 'cutted to clipboard');
            }
          })

          , copy = new gui.MenuItem({
              label: copyLabel || "Copy"
            , click: function () {
                document.execCommand("copy");
                console.log('Menu:', 'copied to clipboard');
            }
          })

          , paste = new gui.MenuItem({
              label: pasteLabel || "Paste"
            , click: function () {
                document.execCommand("paste");
                console.log('Menu:', 'pasted to textarea');
            }
          })
        ;

        menu.append(cut);
        menu.append(copy);
        menu.append(paste);

        return menu;
    }

    var menu = new Menu(/* pass cut, copy, paste labels if you need i18n*/);
    $(document).on("contextmenu", function (e) {
        e.preventDefault();
        menu.popup(e.originalEvent.x, e.originalEvent.y);
    });
});