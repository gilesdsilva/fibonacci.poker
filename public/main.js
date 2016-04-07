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
    $('#storyNameCurrent').val('');
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

socket.on('resetonclosestory', function() {
    reset();
});

socket.on('connect', function () {
    var loginName = localStorage.getItem("loginName");
    socket.emit('adduser', loginName);
});

socket.on('updatechat', function (username, data) {
    $('#connections').append('<b>' + escaped(username) + ':</b> ' + escaped(data) + "<br/>");
});


socket.on('updatestorysummary', function (storyPoints,isUserAdmin) {
    $('#storySummary').empty();
    $('#storySummaryTable tbody').remove();
    $.each(storyPoints, function (key, value) {
        var game = key;
        $.each(value, function (story, points) {
            var style = ''
            if(isUserAdmin == false)
                style = 'style=\'display:none\'';
            else
                style = 'style=\'display:block\'';
            $('#storySummaryTable').append('<tr><td class=\'game\'>' + game + '</td><td class=\'story\'>' + story + '</td><td class=\'points\'>' + points + '</td><td><input type=\'button\''+ style +' value=\'delete\'></td></tr>');
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
    disable = isEmpty(storyNameExists) || disable;
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
        socket.emit("deletestory",game,story)
    })
});

function updateStoryName() {
    var storyName = $('#storyName').val();
    if(isEmpty(storyName)) {
        disableStoryPointsEntering(true);
    } else {
        $('#storyNameCurrent').val(storyName);
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