function escaped(s) {
    return $("<div></div>").html(s).html();
}

window.addEventListener('load', function(){
    var loginName= getUrlParameter('loginName');
    if(loginName) {
        localStorage.setItem("loginName", loginName);
    }
});

var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};

function reset() {
    $('#storyNameCurrent').text('');
    $('#finalStoryPoints').val('');
    $('#storyPoints').val('');
    $('#storyName').val('');
    disableStoryPointsEntering(true);
    $('#closeStoryButton').hide();
    $('#finalStoryPoints').hide();
    var state = $('#showpointsswitch').bootstrapSwitch('state');
    if(state) {
        $('#showpointsswitch').bootstrapSwitch('toggleState');
        $('#showpointsswitch').bootstrapSwitch('setState',false);
    }
}

function closeStory() {
    var finalStoryPoints = $('#finalStoryPoints').val();
    var storyName =  $('#storyName').val();
    var gameName = $('#gameName').val();
    if(finalStoryPoints && storyName) {
        socket.emit('closestory', finalStoryPoints,gameName,storyName);
    }
}

var socket = io.connect('/');

$(window).load(function(){
    $('#showpointsswitch').bootstrapSwitch();
});

$(window).bind("beforeunload", function() {
    var loginName = localStorage.getItem("loginName");
    socket.emit('onwindowclose',loginName);
});

socket.on('reset', function() {
    reset();
});

socket.on('connect', function () {
    var loginName = localStorage.getItem("loginName");
    socket.emit('adduser', loginName);
});

socket.on('updatechat', function (username, data) {
    $('#connections').append('<b>' + escaped(username) + ':</b> ' + escaped(data) + "<br/>");
});


socket.on('updatestorysummary', function (games,isUserAdmin) {
    $('#storySummary').empty();
    $('#storySummaryTable tbody').remove();
    var style = '';
    style = isUserAdmin ? 'style=\'display:block\'' : 'style=\'display:none\'';
    $.each(games, function (game, stories) {
        var refTarget = game.replace(/ /g,'') + 'stories';
        $('#storySummaryTable').append('<tr><td><button type=\'button\' data-toggle=\'collapse\' data-target=\'.'+ refTarget +'\'>'+ game+'</button></td><td class=\'game\' style=\'display:none\' >'+ game +'</td><td class=\'story\' style=\'display:none\' ></td><td></td><td><td><input type=\'button\' '+ style + ' value=\'deleteAll\'></td></tr>');
        $.each(stories, function (story, points) {

            $('#storySummaryTable').append('<tr class=\'hiddenRow collapse out '+ refTarget +'\'><td class=\'game\'>'+ game +'</td><td class=\'story\'>' + story + '</td><td>' + points + '</td><td><input type=\'button\' '+ style + ' value=\'delete\'></td></tr>');
        });
    });
});

socket.on('updatestoryname', function (storyName) {
    if(storyName) {
        $('#storyNameCurrent').text(storyName);
        disableStoryPointsEntering(false);
    }
});

function updateStoryPoints(visible,storyPoints) {
    $('#storyPointsResult').empty();
    $.each(storyPoints, function (key, value) {
        if(value)
            if(visible == true) {
                $('#storyPointsResult').append('<div><b>' + escaped(value) + '</b></div>');
            }
             else {
                $('#storyPointsResult').append('<div><b>*</b></div>');
            }
        else {
            $('#storyPointsResult').append('<div><b>&nbsp;</b></div>');
        }
    });
}

socket.on('updatefinalstorypoints',function(finalStoryPoints) {
    $('#finalStoryPoints').val(finalStoryPoints);
});

socket.on('updatestorypointsvisible', function (storyPoints) {
    updateStoryPoints(true,storyPoints);
    $('#finalStoryPoints').show();
    $('#closeStoryButton').show();
    disableStoryPointsEntering(true);
});

socket.on('updatestorypointshidden', function (storyPoints) {
    updateStoryPoints(false,storyPoints);
    $('#closeStoryButton').hide();
    $('#finalStoryPoints').hide();
    $('#storyPoints').prop('disabled', storyName ||false);
    disableStoryPointsEntering(false);
});

function disableStoryPointsEntering(disable) {
    var storyNameExists = $('#storyName').val();
    var storyNameCurrentExists = $('#storyNameCurrent').text();
    disable = (isEmpty(storyNameExists) && isEmpty(storyNameCurrentExists))  || disable;
    $('#storyPoints').prop('disabled', disable);
}

function isEmpty(str) {
    return typeof str == 'string' && !str.trim() || typeof str == 'undefined' || str === null;
}

socket.on('updateusers', function (data) {
    $('#users').empty();
    $.each(data, function (key, value) {
        $('#users').append('<div>' + key + '</div>');
    });
});

socket.on('updateuserisadmin', function () {
    $('#rowGameName').show();
    $('#rowStoryName').show();
    $('#rowFinalStoryPoints').show();
    $('#rowShowStoryPoints').show();
});

$(function (){
    $('#showpointsswitch').on('switchChange.bootstrapSwitch', function(event, state) {
        console.log(state);
        if(state) {
            socket.emit('showstorypoints',true);
        } else {
            socket.emit('showstorypoints',false);
        }
    });
});

$(function () {

    function updateStoryPoints() {
        var points = $('#storyPoints').val();
        socket.emit('sendstorypoints', points);
    }

    $('#storyPoints').focusout(function() {
        updateStoryPoints();
    });

    $('#storyPoints').keypress(function (e) {
        if (e.which == 13) {
            updateStoryPoints();
        }
    });
});

$(function() {
    $('#storySummaryTable').on('click', 'input[type="button"]', function(e){
        var game = $(this).closest('tr').children('td.game').text();
        var story = $(this).closest('tr').children('td.story').text();
        if(story) {
            socket.emit("deletestory",game,story)
        } else {
            socket.emit("deletegame",game);
        }
    })
});

function updateStoryName() {
    var storyName = $('#storyName').val();
    if(isEmpty(storyName)) {
        $('#storyNameCurrent').text('');
        disableStoryPointsEntering(true);
    } else {
        $('#storyNameCurrent').text(storyName);
        socket.emit('sendstoryname', storyName);
    }

}
$(function() {

    $('#storyName').focusout(function() {
       updateStoryName();
    });

    $('#storyName').keypress(function (e) {
        if (e.which == 13) {
            updateStoryName();
        }
    });
});

$(function () {

    function updateGameName() {
        var gameName = $('#gameName').val();
        socket.emit('updategamename', gameName);
    }

    $('#gameName').focusout(function () {
        updateGameName();
    });

    $('#gameName').keypress(function (e) {
        if (e.which == 13) {
           updateGameName();
        }
    });
});