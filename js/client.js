$(function () {
    var deleteGroceryItem = function ($elem) {
        var groceryKey = $elem.parent().attr("data-key");
        console.log("sending 'remove grocery item' to server for " + groceryKey);
        server.emit("remove grocery item", groceryKey);
    };

    var toggleInCart = function($elem){
        var groceryKey = $elem.parent().attr("data-key");
        var action = '';
        if ($elem.css('text-decoration') === 'line-through' ) {
            action = 'remove item from cart';
            //$elem.css("text-decoration", '');
            //$elem.parent().find('.in-cart').hide();
            //$elem.parent().find('.delete-button').show();
        }else {
            action = 'add item to cart';
            //$elem.css("text-decoration", 'line-through');
            //$elem.parent().find('.delete-button').hide();
            //$elem.parent().find('.in-cart').show();
        }
        console.log("sending '" + action + "' to server for " + groceryKey);
        server.emit(action, groceryKey);
    };

    var server = io.connect(window.location.href);
    server.on('connect', function () {
        console.log('established new connection to server, clearing local grocery list');
        $('#grocery-items').find('li').remove();
        console.log("sending 'request all' to server");
        server.emit("request all");
    });
    server.on('new grocery item', function (groceryItemJSON) {
        console.log("received item " + groceryItemJSON);
        var groceryItem = JSON.parse(groceryItemJSON);
        var $groceryItems = $('#grocery-items');
        $groceryItems.find("[data-key='" + groceryItem.key + "']").remove();
        var $li = $('<li data-key="' + groceryItem.key + '"></li>');
        var $dataSpan = $('<span class="grocery-item">' + groceryItem.data.name + '</span>');
        var $deleteButton = $('<span class="delete-button">&times</span>');
        var $inCart = $('<span hidden class="in-cart">in cart!</span>');
        $li.append($dataSpan).append($deleteButton).append($inCart);
        $groceryItems.show().append($li);
        $deleteButton.click(function(){
            deleteGroceryItem($(this));
        });
        $dataSpan.click(function(){
            toggleInCart($(this));
        });
        $('#no_items').hide();
    });
    server.on('remove grocery item', function (groceryKey) {
        console.log("received 'remove grocery item' from server for " + groceryKey);
        var $groceryItems = $('#grocery-items');
        $groceryItems.find("[data-key='" + groceryKey + "']").remove();
        if ($groceryItems.find('li').length < 1) {
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
            console.log("sending 'new grocery item' to server " + groceryDataJSON);
            server.emit('new grocery item', groceryDataJSON);
            $newItemInput.val('');
        }
    });
});