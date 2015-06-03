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
    $('#txtSource').bind('input propertychange', function () {
        window.textSource = $("#txtSource").val();
        updateOutput();
    });
    $('#txtCSS').bind('input propertychange', function () {
        window.textSource = $("#txtSource").val();
        updateOutput();
    });
    $('#txtReplace').bind('input propertychange', function () {
        window.textSource = $("#txtSource").val();
        updateOutput();
    });
    $("#playerBox").resizable({
        handles: {
            'se': '#segrip'
        }
    });
    $("#playerBox").resize(function () {
        $("#player").height($("#playerBox").height());
        $("#player").width($("#playerBox").width());
    });
    
});

function updateSentence(pos, newValue) {
    var sourceText = $("#txtSource").val();
    //var re = new RegExp("\/" + classActualName + "\/([^\/]*)\/", "g");
    //lineText = lineText.replace(re, '<span class="' + classActualName + '">$1</span>');
    var textToSearch = '{|' + pos + '|';
    var indexOfItem = sourceText.indexOf(textToSearch);
    var indexOfMiddlePipe = sourceText.indexOf('|', indexOfItem+2);
    var indexOfEnd = sourceText.indexOf('|}', indexOfMiddlePipe+1);
    var newString = sourceText.substr(0, indexOfMiddlePipe+1) + newValue + sourceText.substr(indexOfEnd);
    $("#txtSource").val(newString);
    updateOutput();
}

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

function convertSourceToOutput(sourceText, includeVideo, divHeight) {
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
    var htmlPre = '<span class="videojots">';
    var startScopedStyle = '<style scoped>';
    var clickableStyle = '.clickable{cursor:pointer;cursor:hand;}.clickable:hover{background:yellow;} ';
    var style = clickableStyle+ $("#txtCSS").val();
    var endScopedStyle = '</style>';
    var footer = '<br/><span style="font-size:xx-small;">Video outline created using <a target="_blank" href="http://thesoonerdev.github.io/videojots/">VideoJots</a></span><br/>';
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
            else if (lineText.charAt(0) === '/' && lineText.charAt(lineText.length - 1) === '/' && lineText.indexOf(' ') === -1) {
                //starts and ends with /, no space means the whole line represents a tag
                var insideText = lineText.substring(1, lineText.length - 1);
                var tagName = insideText;
                var tagValue = '';
                if (insideText.indexOf('/') > -1) {
                    tagName = insideText.split('/')[0];
                    tagValue = insideText.split('/')[1];
                    htmlRaw = '<span class="' + tagName + '">' + tagValue + '</span>';
                } else {
                    htmlRaw = '<span class="' + tagName + '">';
                }
            } else {
                var boldRegexp = /\/b\/([^\/]*)\//g;
                lineText = lineText.replace(boldRegexp, '<b>$1</b>');
                var italicRegexp = /\/i\/([^\/]*)\//g;
                lineText = lineText.replace(italicRegexp, '<i>$1</i>');
                var underlineRegexp = /\/u\/([^\/]*)\//g;
                lineText = lineText.replace(underlineRegexp, '<ins>$1</ins>');
                var strikethroughRegexp = /\/s\/([^\/]*)\//g;
                lineText = lineText.replace(strikethroughRegexp, '<del>$1</del>');
                var allCssRules = getRulesFromText($("#txtCSS").val());
                for (var x = 0; x < allCssRules.length; x++) {
                    var className = allCssRules[x].selectorText;
                    var classActualName = className.substring(1);
                    var re = new RegExp("\/" + classActualName + "\/([^\/]*)\/", "g");
                    lineText = lineText.replace(re, '<span class="' + classActualName + '">$1</span>');
                }
                htmlRaw = lineText;
            }
            htmlRaw = replaceAll(htmlRaw, '/n/', '<br/>');
            var prefix = '<span class="clickable" onclick="playVideoAt(' + (location/1000) + ')">';
            var suffix = '</span>';
            if (htmlRaw.startsWith('<span class=')) {
                prefix = '';
                suffix = '';
            }
            htmlFromSource += prefix + htmlRaw + suffix;
        }
    });
    var styleAttr = '';
    if (divHeight > 0) {
        styleAttr = 'style="height:' + divHeight + 'px;overflow-y:auto"';
    }
    htmlFromSource = '<div '+styleAttr+' class="resizable"><br/>' + htmlFromSource + footer+'</div>';
    html = htmlPre + playerHTML+ startScopedStyle + style + endScopedStyle + htmlFromSource + htmlPost;
    return html;
}

function getRulesFromText(cssRulesText) {
    var doc = document.implementation.createHTMLDocument(""), styleElement = document.createElement("style");
    styleElement.textContent = cssRulesText;
    doc.body.appendChild(styleElement);
    return styleElement.sheet.cssRules;
}

if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function (str) {
        return this.slice(0, str.length) == str;
    };
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
        window.currPosition = Math.ceil(player.getCurrentTime()*1000);
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
    updateCurrentJot(htmlEncode(text));
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
    $("#txtSource").val(window.textSource);
}

function updateCurrentJot(text) {
    var htmlJot = convertSourceToOutput('{|'+0+'|'+text+'|}',false,0);
    $("#spnCurrentJot").html(htmlJot);
}

function keyPressEvent(e) {
    var tb = document.getElementById("tbNotes");
    var text = tb.value;
    var textToDisplay = text;
    var sourceText = text;
    var encodedText = htmlEncode(sourceText);
    if (e.keyCode === 13) {
        var command = getCommand(text);
        var doNotDisplay = false;
        if (command === COMMAND.POP) {
            //pop last tag from array
            window.tagArray.remove(window.tagArray.length - 1);
            encodedText = '</span>';
            //doNotDisplay = true;
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
            sourceText = htmlEncode(text);
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
            encodedText = slashString + htmlEncode(text.substring(numSlashes, text.length));
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
                        var tag = inside.substring(0, inside.indexOf('/'));
                        var tagValue = inside.substring(inside.indexOf('/') + 1);
                        textToDisplay = tagValue;
                        //sourceText = '<' + tag + '>' + tagValue + '</' + tag + '>';
                        encodedText = '<span class="' + tag + '">' + htmlEncode(tagValue) + '</span>';
                    } else {
                        window.tagArray.push(tagName);
                        encodedText = '<span class="' + tagName + '">';
                    }
                    displayTagArray();
                }
            }
        }
        if (!doNotDisplay && encodedText.trim() !== '') {
            addToSource(encodedText, window.currPosition);
            updateOutput();
        }
        tb.value = '';
        isClear = true;
        $("#spnNextJot").text('');
        return false;
    }
}

function updateOutput() {
    var output = convertSourceToOutput($("#txtSource").val(), false,0);
    var outputWithPlayer = convertSourceToOutput($("#txtSource").val(), true,300);
    $("#pnlNotes").html(output);
    $("#viewoutput").html(output);
    $("#txtOutputHTML").text(outputWithPlayer);
    $("#pnlNotes").scrollTop($("#pnlNotes")[0].scrollHeight);
    renderSource();
}

function renderSource() {
    var sourceText = $("#txtSource").val();
    var allText = sourceText;
    var lines = allText.split("{|");
    var table =  $('<table/>', {});
    $.each(lines, function (index, value) {
        if (value !== '') {
            var items = value.split('|');
            var pos = parseFloat(items[0]);
            var text = items[1].split('|}')[0];
            var tr = $('<tr/>', {});
            var textArea = $('<textarea>', {
                id: "txt_" + pos.toString()
            });
            $(textArea).text(text);
            $(textArea).prop('readonly', true);
            var tdTextArea = $('<td/>', {});
            tdTextArea.append(textArea);
            var button = $('<button/>', {
                id: "btnEditText_" + pos.toString(),
                text: 'Edit'
            });
            $(button).addClass('btn');
            $(button).addClass('btn-primary');
            $(button).addClass('editable');
            var tdButton = $('<td/>', {});
            tdButton.append(button);
            tr.append(tdTextArea).append(tdButton);
            table.append(tr);
        }
    });
    $("#source").html(table.html());
    $(".btn").click(function () {
        if (this.id.startsWith('btnEditText_')) {
            var id = this.id;
            var pos = id.split('_')[1];
            if (this.textContent === 'Edit') {
                var taId = '#txt_' + pos.toString();
                $(taId).prop('readonly', false);
                this.textContent = 'Save';
            }
            else if (this.textContent === 'Save') {
                var taId = '#txt_' + pos.toString();
                var newValue = $(taId).val();
                updateSentence(pos, newValue);
                this.textContent = 'Edit';
            }
        }
    });
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

function previewHtml() {
    var newWindow = window.open();
    newWindow.document.write($("#txtOutputHTML").val());
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