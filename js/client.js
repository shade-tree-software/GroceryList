$(function () {
    var server = io.connect(window.location.href);
    server.on('connect', function () {
    });
    server.on('new grocery item', function (groceryItemJSON) {
        console.log("received item "+ groceryItemJSON);
        var groceryItem = JSON.parse(groceryItemJSON);
        var $groceryItems = $('#grocery-items');
        $groceryItems.find("[data-key='" + groceryItem.key + "']").remove();
        var $li = $('<li data-key="' + groceryItem.key + '"></li>');
        var $dataSpan = $('<span class="grocery-item">' + groceryItem.data.name + '</span>');
        var $deleteButton = $('<span class="delete-button">&times</span>');
        $li.append($dataSpan).append($deleteButton);
        $groceryItems.show().append($li);
        $deleteButton.click(function(){
            var groceryKey = $(this).parent().attr("data-key");
            console.log('request server to delete item ' + groceryKey);
            server.emit("remove grocery item", groceryKey);
        });
        $('#no_items').hide();
    });
    server.on('remove grocery item', function(groceryKey){
        console.log("received remove request for item " + groceryKey);
        var $groceryItems = $('#grocery-items');
        $groceryItems.find("[data-key='" + groceryKey + "']").remove();
        if ($groceryItems.find('li').length < 1){
            $groceryItems.hide();
            $('#no_items').show();
        }
    });
    $('#new_item_form').submit(function (e) {
        e.preventDefault();
        var $newItemInput = $('#new_item_input');
        var newItem = $newItemInput.val();
        if (newItem.length > 0) {
            var groceryDataJSON = JSON.stringify({name: newItem});
            console.log('telling server to add item: ' + groceryDataJSON);
            server.emit('new grocery item', groceryDataJSON);
            $newItemInput.val('');
        }
    });
});