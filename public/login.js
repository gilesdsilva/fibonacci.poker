var socket = io.connect('/');

socket.on('connect', function() {
});

$(function() {
    $('#loginName').keypress(function(e) {
        if (e.which == 13) {
            var name = $('#loginName').val();
            $('#rowLogin').hide();
            $('#rowStory').show();
            $('#rowFinalStoryPoints').hide();
            $('#rowGameName').hide();
            $('#rowStoryName').hide();
            $('#rowStorySummary').hide();
            $('#rowStorySummary').show();
            $('#rowStoryPoints').show();
            $('#userPoints').show();
            $('#userList').show();
            $('#connections').show();
            window.location = "main?loginName="+name;
            localStorage.setItem("loginName", name);
        }
    });
});