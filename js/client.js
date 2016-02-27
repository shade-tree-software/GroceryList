$(function () {
    var server = io.connect(window.location.href);
    server.on('connect', function () {
    });
    server.on('new grocery item', function (new_grocery_item) {
        console.log("received item: "+ new_grocery_item);
        var grocery_item = JSON.parse(new_grocery_item);
        var $li = $('<li><span class="grocery-item">' + grocery_item.item + '</span></li>');
        var $deleteButton = $('<span data-index="' + grocery_item.index + '" class="delete-button">&times</span>');
        $li.append($deleteButton);
        $('#grocery-items').show().append($li);
        $deleteButton.click(function(){
            console.log('delete');
            var index = parseInt($(this).attr("data-index"));
            server.emit("remove grocery item", index);
        });
        $('#no_items').hide();
    });
    server.on('remove grocery item', function(index){
        console.log("received remove request for item: " + index);
        $('#grocery-items').find("[data-index='" + index + "']").parent().remove();
    });
    $('#new_item_form').submit(function (e) {
        e.preventDefault();
        var $new_item_input = $('#new_item_input');
        var new_item = $new_item_input.val();
        if (new_item.length > 0) {
            server.emit('new grocery item', $new_item_input.val());
            $new_item_input.val('');
        }
    });
});