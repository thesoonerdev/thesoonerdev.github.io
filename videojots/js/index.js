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
    //initialize globals
    window.tagArray = [];
    window.textSource = '';
    window.currVideoID = 'unknown';
    window.outputFormat = 'bounded';
    window.textAreaBeingEdited = null;
    //initialize controls
    $("#btnInsertLineBreak").prop('disabled', true);
    //create event handlers
    $('#selectClasses').change(function () {
        var predefined = ['b', 'i', 's', 'u'];
        var getSelection = get_selection(window.textAreaBeingEdited).text;
        var selectedVal = $(this).find(':selected').val().toString();
        var replaceStr = '';
        if ($.inArray(selectedVal,predefined)>-1) {
            replaceStr = '<' + selectedVal + '>' + getSelection + '</' + selectedVal + '>';
        } else {
            replaceStr = '<span class="' + selectedVal + '">' + getSelection + '</span>';
        }
        replace_selection(window.textAreaBeingEdited, replaceStr);
    });
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
    $("#slider").slider();
    $("#saveLink").attr("href", "data:text/plain;charset=utf-8," + $("#txtSource").val()).attr("download", window.currVideoID + ".txt");
    $('#selector button').click(function () {
        $(this).addClass('active').siblings().removeClass('active');
        var selectedName = $(this).attr('name');
        window.outputFormat = selectedName;
        updateOutput();
    });
    document.getElementById('file-input')
  .addEventListener('change', readSingleFile, false);
});

function readSingleFile(e) {
    var file = e.target.files[0];
    if (!file) {
        return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
        var contents = e.target.result;
        loadFile(contents);
    };
    reader.readAsText(file);
}

function loadFile(contents) {
    var json = null;
    var source = '';
    var style = '';
    var videoid = null;
    try {
        json = JSON.parse(contents);
        source = json.text;
        style = json.css;
        videoid = json.videoid;
    } catch (e) {
        //when using old format
        //get videoid from filename
        source = contents;
        var fullPath = document.getElementById('file-input').value;
        if (fullPath) {
            videoid = fullPath.split(/(\\|\/)/g).pop();
            videoid = videoid.substring(0, videoid.lastIndexOf('.'));
        }
    }
    loadVideoInPlayer(videoid);
    $("#txtSource").val(source);
    $("#txtCSS").val(style);
    updateOutput();
}

function insertLineBreak() {
    var taId = window.textAreaBeingEdited;
    var caretPos = document.getElementById(taId).selectionStart;
    var taElem = $('#' + taId);
    var textAreaTxt = taElem.val();
    var textToInsert = '/n/';
    var newVal = textAreaTxt.substring(0, caretPos) + textToInsert + textAreaTxt.substring(caretPos);
    $(taElem).val(newVal);
}

function updateSentence(pos, newValue, newPos) {
    var sourceText = window.textSource;
    var textToSearch = '{|' + pos + '|#|';
    var indexOfItem = sourceText.indexOf(textToSearch);
    var indexOfMiddlePipe = sourceText.indexOf('|#|', indexOfItem+2);
    var indexOfEnd = sourceText.indexOf('|}', indexOfMiddlePipe+3);
    var newString = sourceText.substr(0, indexOfMiddlePipe + 3) + newValue + sourceText.substr(indexOfEnd);
    var newPosString = newString;
    if (newPos !== pos) {
        indexOfItem = newString.indexOf(textToSearch);
        indexOfMiddlePipe = newString.indexOf('|#|', indexOfItem + 4);
        newPosString = newString.substr(0, indexOfItem+2) + newPos + newString.substr(indexOfMiddlePipe);
    }
    window.textSource = newPosString;
    $("#txtSource").val(window.textSource);
    updateOutput();
}

function deleteSentence(pos) {
    if (confirm('Confirm delete?')) {
        var sourceText = window.textSource;
        var textToSearch = '{|' + pos + '|#|';
        var indexOfItem = sourceText.indexOf(textToSearch);
        var indexOfMiddlePipe = sourceText.indexOf('|#|', indexOfItem + 2);
        var indexOfEnd = sourceText.indexOf('|}', indexOfMiddlePipe + 3);
        var newString = sourceText.substr(0, indexOfItem - 1) + sourceText.substr(indexOfEnd + 1);
        window.textSource = newString;
        $("#txtSource").val(window.textSource);
        updateOutput();
        renderSource();
    }
}

function getVideoIDFromURL(url) {
    return url.split('v=')[1].split('&')[0];
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
    loadVideoInPlayer(videoid);
    clearPage();
}

function loadVideoInPlayer(videoid) {
    player.loadVideoById(videoid);
    window.currVideoID = videoid;
}

function clearPage() {
    $("#pnlNotes").html('');
    $("#txtSource").text('');
    $("#tbNotes").html('');
    $("#txtSource").val('');
    $("#txtCSS").val('');
    renderSourceData();
    isClear = true;
}

function convertSourceToOutput(sourceText, includeVideo, divHeight) {
    var playerHTML = '';
    if (includeVideo) {
        var videoID = window.currVideoID;
        var playerID = videoID.replace(/-/g, "");
        var scriptHTML = '<br/><div id="' + videoID + '"></div><script>var tag=document.createElement("script");tag.src="https://www.youtube.com/iframe_api";var firstScriptTag=document.getElementsByTagName("script")[0];firstScriptTag.parentNode.insertBefore(tag,firstScriptTag);var player' + playerID + ';function onYouTubeIframeAPIReady(){player' + playerID + '=new YT.Player("' + videoID + '",{height:"390",width:"640",videoId:"' + videoID + '",playerVars:{autostart:0,autoplay:0,controls:1},events:{onReady:onPlayerReady,onStateChange:onPlayerStateChange}})}function onPlayerReady(a){var elems = document.getElementsByClassName("clickable");for (var i = 0; i < elems.length; i++) {elems[i].addEventListener("click",(function(i) {return function() {playVideoAt(this.id);}})(i),false);}}var done=!1;function onPlayerStateChange(a){}function playVideo(){player' + playerID + '.playVideo()}function pauseVideo(){player'+playerID+'.pauseVideo()}function stopVideo(){player'+playerID+'.stopVideo()}function loadVideoById(a){player'+playerID+'.loadVideoById(a,0,"large")}function playVideoAt(pos){player'+playerID+'.seekTo(parseFloat(pos))};</script>';
        var htmlInfo = '<br/><b>Click on text below to jump to specific point in the video</b>';
        playerHTML = scriptHTML+htmlInfo;
    }
    var allText = sourceText;
    var lines = allText.split("{|");
    var html = '';
    var htmlPre = '<div style="margin: 0 auto;width:70%" ><div style=""><span class="videojots">';
    var startScopedStyle = '<style scoped>';
    var clickableStyle = '.clickable{cursor:pointer;cursor:hand;}.clickable:hover{background:yellow;} ';
    var style = clickableStyle+ $("#txtCSS").val();
    var endScopedStyle = '</style>';
    var footer = '<br/><span style="font-size:xx-small;">Video outline created using <a target="_blank" href="http://thesoonerdev.github.io/videojots/">VideoJots</a></span><br/>';
    var htmlPost = '</span></div></div>';
    var htmlFromSource = '';
    $.each(lines, function (index, value) {
        if (value.trim() !== '') {
            var location = parseFloat(value.split("|#|")[0]);
            var lineText = value.split("|#|")[1].split("|}")[0];
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
            var prefix = '<span class="clickable" id="' + (location / 1000) + '">';
            var suffix = '</span>';
            if (htmlRaw.startsWith('<span class=') && !htmlRaw.endsWith('</span>')) {
                prefix = '';
                suffix = '';
            }
            htmlFromSource += prefix + htmlRaw + suffix;
        }
    });
    var styleAttr = '';
    if (window.outputFormat === 'bounded') {
        if (divHeight > 0) {
            styleAttr = 'style="height:' + divHeight + 'px;overflow-y:auto"';
        }
    }
    htmlFromSource = '<div ' + styleAttr + ' class="resizable"><br/>' + htmlFromSource + footer + '</div>';
    html = htmlPre + playerHTML+ startScopedStyle + style + endScopedStyle + htmlFromSource + htmlPost;
    return html;
}

function getRulesFromText(cssRulesText) {
    var doc = document.implementation.createHTMLDocument(""), styleElement = document.createElement("style");
    styleElement.textContent = cssRulesText;
    doc.body.appendChild(styleElement);
    return styleElement.sheet.cssRules;
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
    if (text.endsWith('//')) {
        var textBefore = text.substring(0, text.length - 2);
        var slashBefore = textBefore.lastIndexOf('/');
        if (slashBefore > -1) {
            var inside = textBefore.substring(slashBefore + 1);
            var rewind = TryParseInt(inside, null);
            if (rewind) {
                player.seekTo(player.getCurrentTime() + rewind);
                //remove markers from display
                tb.value = text.substring(0, slashBefore);
            }
        }
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

function sortJotsByPosition() {
    var sourceText = $("#txtSource").val();
    var allText = sourceText;
    var lines = allText.split("{|");
    var sorted = [];
    $.each(lines, function (index, value) {
        if (value !== '') {
            var items = value.split('|#|');
            var textVal = items[1].split('|}')[0];
            var pos = parseFloat(items[0]);
            var obj = {};
            obj.pos = pos;
            obj.text = textVal;
            sorted.push(obj);
        }
    });
    sorted = _.sortBy(sorted, function (o) { return o.pos; });
    var sortedText = '';
    $.each(sorted, function (index, value) {
        var currObj = value;
        sortedText += '{|' + currObj.pos + '|#|' + currObj.text + '|}';
    });
    window.textSource = sortedText;
    $("#txtSource").val(window.textSource);
}

function addToSource(text, position) {
    var sourceText = $("#txtSource").val();
    var allText = sourceText;
    var lines = allText.split("{|");
    var sorted = [];
    $.each(lines, function (index, value) {
        if (value !== '') {
            var items = value.split('|#|');
            var textVal = items[1].split('|}')[0];
            var pos = parseFloat(items[0]);
            if (position === pos) {
                //avoid multiple lines having the same exact position,
                //which can mess up parsing
                position += 1;
            }
            var obj = {};
            obj.pos = pos;
            obj.text = textVal;
            sorted.push(obj);
        }
    });
    var lastObj = {};
    lastObj.pos = position;
    lastObj.text = text;
    sorted.push(lastObj);
    sorted = _.sortBy(sorted, function (o) { return o.pos; });
    var sortedText = '';
    $.each(sorted, function(index, value) {
        var currObj = value;
        sortedText += '{|' + currObj.pos + '|#|' + currObj.text + '|}';
    });
    window.textSource = sortedText;
    $("#txtSource").val(window.textSource);
    updateOutput();
}

function updateCurrentJot(text) {
    var htmlJot = convertSourceToOutput('{|'+0+'|#|'+text+'|}',false,0);
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
    sortJotsByPosition();
    displayOutlineProgress();
    var output = convertSourceToOutput($("#txtSource").val(), false,0);
    var outputWithPlayer = convertSourceToOutput($("#txtSource").val(), true, 300);
    $("#pnlNotes").html('');
    $("#pnlNotes").html(output);
    $("#viewoutput").html('');
    $("#viewoutput").html(output);
    $("#txtOutputHTML").text('');
    $("#txtOutputHTML").text(outputWithPlayer);
    $("#pnlNotes").scrollTop($("#pnlNotes")[0].scrollHeight);
    var allrules = getAllRules();
    $("#selectClasses").html('');
    $.each(allrules, function(index, value) {
        $("#selectClasses").append($('<option/>', {
            value: value,
            text:value
        }));
    });
    renderSource();
}

function getAllRules() {
    var allRules = [];
    allRules.push('b');
    allRules.push('i');
    allRules.push('s');
    allRules.push('u');
    var allCssRules = getRulesFromText($("#txtCSS").val());
    for (var x = 0; x < allCssRules.length; x++) {
        var className = allCssRules[x].selectorText;
        var classActualName = className.substring(1);
        allRules.push(classActualName);
    }
    return allRules;
}

function displayOutlineProgress() {
    var sourceText = $("#txtSource").val();
    var allText = sourceText;
    var lines = allText.split("{|");
    $("#outlineProgress").html('');
    var table = $('<table/>', {});
    table.addClass('table');
    table.css('table-layout', 'fixed');
    table.css('border', '1px solid black');
    var tr = $('<tr/>', {});
    for (var i = 0; i < 100; i++) {
        var cell = $('<td/>', {
            id:'cell_'+i
        });
        cell.css('width', '1%');
        tr.append(cell);
    }
    table.append(tr);
    $("#outlineProgress").append(table);
    $.each(lines, function(index, value) {
        if (value !== '') {
            var items = value.split('|#|');
            var pos = parseFloat(items[0]);
            var videoLength = player.getDuration();
            var percent = Math.floor((pos / videoLength * (100 / 1000)));
            $('#cell_' + percent).css('background-color', 'green');
        }
    });
}

function saveHtml() {
    var fullHtml = generateHtmlFromSource();
    var blob = new Blob([fullHtml], { type: "text/plain;charset=utf-8" });
    saveAs(blob, currVideoID + ".html");
}

function saveHtmlWithGA() {
    if ($("#tbGA").val() === '') {
        alert('No Google Analytics code was input!');
    } else {
        var fullHtml = generateHtmlFromSourceWithGA();
        var blob = new Blob([fullHtml], { type: "text/plain;charset=utf-8" });
        saveAs(blob, currVideoID + ".html");
    }
}

function saveFile() {
    var currTitle = player.getVideoData().title;
    var currDuration = player.getDuration();
    var textToWrite = $("#txtSource").val();
    var cssToWrite = $("#txtCSS").val();
    var json = {
        "text": textToWrite,
        "css": cssToWrite,
        "videoid": currVideoID,
        "title": currTitle,
        "duration":currDuration
    };
    var blob = new Blob([JSON.stringify(json)], { type: "text/plain;charset=utf-8" });
    saveAs(blob, currVideoID+".txt");
}

function renderSource() {
    renderSourceData();
    $(".btn").click(function () {
        if (this.id.startsWith('btnEditText_')) {
            var id = this.id;
            var pos = id.split('_')[1];
            if (this.textContent === 'Edit') {
                $('#btnInsertLineBreak').prop('disabled', false);
                var taId = '#txt_' + pos.toString();
                $(taId).prop('readonly', false);
                window.textAreaBeingEdited = 'txt_'+pos.toString();
                this.textContent = 'Save';
                var curPos = parseFloat(pos) / 1000;
                player.seekTo(curPos);
                player.pauseVideo();
                $("#slider").show();
                $("#slider").slider({
                    value: curPos,
                    min: curPos - 10,
                    max: curPos + 10,
                    step:0.1,
                    slide: function (event, ui) {
                        $('#txtEditPos_' + pos).val(ui.value);
                        player.seekTo(ui.value);
                    }
                });
                $("#sliderMessage").show();
                $("#sliderSpace").show();
            }
            else if (this.textContent === 'Save') {
                $('#btnInsertLineBreak').prop('disabled', true);
                var taId = '#txt_' + pos.toString();
                var newValue = $(taId).val();
                var newPos = $('#txtEditPos_' + pos).val() * 1000;
                updateSentence(pos, newValue,newPos);
                this.textContent = 'Edit';
                $("#slider").hide();
                $("#sliderMessage").hide();
                $("#sliderSpace").hide();
            }
        }
        if (this.id.startsWith('btnDeleteText_')) {
            var id = this.id;
            var pos = id.split('_')[1];
            deleteSentence(pos);
        }
    });
}

function renderSourceData() {
    $("#source").html('');
    var sourceText = $("#txtSource").val();
    var allText = sourceText;
    var lines = allText.split("{|");
    var table = $('<table/>', {});
    $(table).css('width', '100%');
    var tbody = $('<tbody/>', {});
    table.append(tbody);
    $.each(lines, function (index, value) {
        if (value !== '') {
            var items = value.split('|#|');
            var pos = parseFloat(items[0]);
            var text = items[1].split('|}')[0];
            var tr = $('<tr/>', {});
            var textAreaPos = $('<textarea/>', {
                id:'txtEditPos_'+pos.toString()
            });
            $(textAreaPos).prop('readonly', true);
            $(textAreaPos).text(pos/1000);
            var tdTextAreaPos = $('<td/>', {});
            $(tdTextAreaPos).css('width', '10%');
            $(tdTextAreaPos).append(textAreaPos);

            var textArea = $('<textarea/>', {
                id: "txt_" + pos.toString()
            });
            $(textArea).text(text);
            $(textArea).prop('readonly', true);
            var tdTextArea = $('<td/>', {});
            $(tdTextArea).css("width", '70%');
            tdTextArea.append(textArea);

            var editButton = $('<button/>', {
                id: "btnEditText_" + pos.toString(),
                text: 'Edit'
            });
            $(editButton).addClass('btn');
            $(editButton).addClass('btn-primary');
            $(editButton).addClass('btn-xs');
            $(editButton).addClass('editable');
            var tdEditButton = $('<td/>', {});
            tdEditButton.append(editButton);
            $(tdEditButton).css('width', '10%');
            $(tdEditButton).css('text-align', 'center');

            var deleteButton = $('<button/>', {
                id: "btnDeleteText_" + pos.toString(),
                text: 'Delete'
            });
            $(deleteButton).addClass('btn');
            $(deleteButton).addClass('btn-primary');
            $(deleteButton).addClass('btn-xs');
            $(deleteButton).addClass('deletable');
            var tdDeleteButton = $('<td/>', {});
            tdDeleteButton.append(deleteButton);
            $(tdDeleteButton).css('width', '10%');
            $(tdDeleteButton).css('text-align', 'center');

            tr.append(tdTextAreaPos).append(tdTextArea).append(tdEditButton).append(tdDeleteButton);
            tbody.append(tr);
        }
    });
    $("#source").html(table.html());
}

function displayTagArray() {
    $("#tagArray").html('&nbsp;');
    $.each(window.tagArray, function(index, value) {
        $("#tagArray").append(value+' > ');
    });
}

function previewHtml() {
    var x = window.open();
    var fullHtml = generateHtmlFromSource();
    x.document.open();
    x.document.write(fullHtml);
    x.document.close();
}

function generateHtmlFromSource() {
    var currTitle = player.getVideoData().title;
    var title = '<title>' + htmlEncode(currTitle) + '</title>';
    var bootstrapScript = '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css"><link rel="stylesheet" href="http://code.jquery.com/ui/1.11.4/themes/ui-lightness/jquery-ui.css"/><script src="http://code.jquery.com/jquery-2.1.4.min.js"></script><script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js"></script>';
    var mathjaxScript = '<script type="text/x-mathjax-config">MathJax.Hub.Config({tex2jax: {inlineMath: [[\'$\',\'$\'], [\'\\\\(\',\'\\\\)\']]}});</script><script type="text/javascript" src="http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>';
    var head = '<head>' + title + bootstrapScript + mathjaxScript + '</head>';
    var body = '<body>' + $("#txtOutputHTML").val() + '</body>';
    var fullHtml = '<html>' + head + body + '</html>';
    return fullHtml;
}

function generateHtmlFromSourceWithGA() {
    var currTitle = player.getVideoData().title;
    var title = '<title>' + htmlEncode(currTitle) + '</title>';
    var bootstrapScript = '<link rel="stylesheet" href="css/bootstrap.min.css"><link rel="stylesheet" href="css/jquery-ui.css"/><script src="js/jquery-2.1.1.min.js"></script><script src="js/bootstrap.min.js"></script>';
    var mathjaxScript = '<script type="text/x-mathjax-config">MathJax.Hub.Config({tex2jax: {inlineMath: [[\'$\',\'$\'], [\'\\\\(\',\'\\\\)\']]}});</script><script type="text/javascript" src="http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>';
    var gaScript = "<script>(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,'script','//www.google-analytics.com/analytics.js','ga');ga('create', '" + $("#tbGA").val() + "', 'auto');ga('send', 'pageview');</script>";
    var head = '<head>'+title+bootstrapScript+mathjaxScript+gaScript+'</head>';
    var body = '<body>' + $("#txtOutputHTML").val() + '</body>';
    var fullHtml = '<html>' + head + body + '</html>';
    return fullHtml;
}

function get_selection(theId) {
    var e = document.getElementById(theId);

    //Mozilla and DOM 3.0
    if ('selectionStart' in e) {
        var l = e.selectionEnd - e.selectionStart;
        return { start: e.selectionStart, end: e.selectionEnd, length: l, text: e.value.substr(e.selectionStart, l) };
    }
        //IE
    else if (document.selection) {
        e.focus();
        var r = document.selection.createRange();
        var tr = e.createTextRange();
        var tr2 = tr.duplicate();
        tr2.moveToBookmark(r.getBookmark());
        tr.setEndPoint('EndToStart', tr2);
        if (r === null || tr === null) return { start: e.value.length, end: e.value.length, length: 0, text: '' };
        var textPart = r.text.replace(/[\r\n]/g, '.'); //for some reason IE doesn't always count the \n and \r in the length
        var textWhole = e.value.replace(/[\r\n]/g, '.');
        var theStart = textWhole.indexOf(textPart, tr.text.length);
        return { start: theStart, end: theStart + textPart.length, length: textPart.length, text: r.text };
    }
        //Browser not supported
    else return { start: e.value.length, end: e.value.length, length: 0, text: '' };
}

function replace_selection(theId, replaceStr) {
    var e = document.getElementById(theId);
    var selection = get_selection(theId);
    var startPos = selection.start;
    var endPos = startPos + replaceStr.length;
    e.value = e.value.substr(0, startPos) + replaceStr + e.value.substr(selection.end, e.value.length);
    set_selection(theId, startPos, endPos);
    return { start: startPos, end: endPos, length: replaceStr.length, text: replaceStr };
}

function set_selection(theId, startPos, endPos) {
    var e = document.getElementById(theId);

    //Mozilla and DOM 3.0
    if ('selectionStart' in e) {
        e.focus();
        e.selectionStart = startPos;
        e.selectionEnd = endPos;
    }
        //IE
    else if (document.selection) {
        e.focus();
        var tr = e.createTextRange();

        //Fix IE from counting the newline characters as two seperate characters
        var stopIt = startPos;
        for (i = 0; i < stopIt; i++) if (e.value[i].search(/[\r\n]/) !== -1) startPos = startPos - .5;
        stopIt = endPos;
        for (i = 0; i < stopIt; i++) if (e.value[i].search(/[\r\n]/) !== -1) endPos = endPos - .5;

        tr.moveEnd('textedit', -1);
        tr.moveStart('character', startPos);
        tr.moveEnd('character', endPos - startPos);
        tr.select();
    }
    return get_selection(theId);
}

function wrap_selection(theId, leftStr, rightStr, selOffset, selLength) {
    var theSelText = get_selection(theId).text;
    var selection = replace_selection(theId, leftStr + theSelText + rightStr);
    if (selOffset !== undefined && selLength !== undefined) selection = set_selection(theId, selection.start + selOffset, selection.start + selOffset + selLength);
    else if (theSelText === '') selection = set_selection(theId, selection.start + leftStr.length, selection.start + leftStr.length);
    return selection;
}

/* Helpers */

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

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function (from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

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

//Source: http://stackoverflow.com/questions/1219860/html-encoding-in-javascript-jquery

function htmlEncode(value) {
    //create a in-memory div, set it's inner text(which jQuery automatically encodes)
    //then grab the encoded contents back out.  The div never exists on the page.
    return $('<div/>').text(value).html();
}

function htmlDecode(value) {
    return $('<div/>').html(value).text();
}

function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function replaceAll(string, find, replace) {
    return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}