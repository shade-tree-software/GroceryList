$(function () {
  var deleteGroceryItem = function ($elem) {
    var groceryKey = $elem.parent().attr("data-key");
    console.log("sending 'remove grocery item' to server for " + groceryKey);
    server.emit("remove grocery item", groceryKey);
  };

  var changeState = function ($elem) {
    var groceryKey = $elem.parent().attr("data-key");
    console.log("sending 'change state' to server for " + groceryKey);
    server.emit('change state', groceryKey);
  };

  var updateState = function (key, val) {
    $elem = $('#grocery-items').find("[data-key='" + key + "']").find('.grocery-item');
    if (val === 'in cart') {
      $elem.css("text-decoration", 'line-through');
      $elem.parent().find('.delete-button').hide();
      $elem.parent().find('.purchased').hide();
      $elem.parent().find('.quarantined').hide();
      $elem.parent().find('.unavailable').hide();
      $elem.parent().find('.already-have').hide();
      $elem.parent().find('.in-cart').show();
    } else if (val === 'purchased') {
      $elem.css("text-decoration", 'line-through');
      $elem.parent().find('.delete-button').hide();
      $elem.parent().find('.in-cart').hide();
      $elem.parent().find('.purchased').show();
      $elem.parent().find('.quarantined').hide();
      $elem.parent().find('.unavailable').hide();
      $elem.parent().find('.already-have').hide();
    } else if (val === 'quarantined') {
      $elem.css("text-decoration", 'line-through');
      $elem.parent().find('.delete-button').hide();
      $elem.parent().find('.in-cart').hide();
      $elem.parent().find('.purchased').hide();
      $elem.parent().find('.quarantined').show();
      $elem.parent().find('.unavailable').hide();
      $elem.parent().find('.already-have').hide();
    } else if (val === 'unavailable') {
      $elem.css("text-decoration", 'line-through');
      $elem.parent().find('.delete-button').hide();
      $elem.parent().find('.in-cart').hide();
      $elem.parent().find('.purchased').hide();
      $elem.parent().find('.quarantined').hide();
      $elem.parent().find('.unavailable').show();
      $elem.parent().find('.already-have').hide();
    } else if (val === 'already have') {
      $elem.css("text-decoration", 'line-through');
      $elem.parent().find('.delete-button').hide();
      $elem.parent().find('.in-cart').hide();
      $elem.parent().find('.purchased').hide();
      $elem.parent().find('.quarantined').hide();
      $elem.parent().find('.unavailable').hide();
      $elem.parent().find('.already-have').show();
    } else {
      $elem.css("text-decoration", '');
      $elem.parent().find('.in-cart').hide();
      $elem.parent().find('.purchased').hide();
      $elem.parent().find('.quarantined').hide();
      $elem.parent().find('.unavailable').hide();
      $elem.parent().find('.already-have').hide();
      $elem.parent().find('.delete-button').show();
    }
    if ($(".purchased").filter(":visible").size() > 0) {
      $('#delete_purchased').show();
    } else {
      $('#delete_purchased').hide();
    }
    if ($(".in-cart").filter(":visible").size() > 0) {
      $('#purchase_cart').show();
    } else {
      $('#purchase_cart').hide();
    }
  };

  var server = io.connect(window.location.href);
  server.on('connect', function () {
    console.log('established new connection to server, clearing local grocery list');
    $('#grocery-items').find('li').remove();
    console.log("sending 'request all' to server");
    server.emit("request all");
  });
  server.on('update grocery item', function (groceryUpdateJSON) {
    console.log("received 'update grocery item' " + groceryUpdateJSON);
    var groceryUpdate = JSON.parse(groceryUpdateJSON);
    if (groceryUpdate.update.hasOwnProperty('state')) {
      updateState(groceryUpdate.key, groceryUpdate.update.state);
    }
  });
  server.on('new grocery item', function (groceryItemJSON) {
    console.log("received 'new grocery item' " + groceryItemJSON);
    var groceryItem = JSON.parse(groceryItemJSON);
    var $groceryItems = $('#grocery-items');
    $groceryItems.find("[data-key='" + groceryItem.key + "']").remove();
    var $li = $('<li data-key="' + groceryItem.key + '"></li>');
    var $dataSpan = $('<span class="grocery-item">' + groceryItem.data.name + '</span>');
    var $deleteButton = $('<span class="delete-button">&times</span>');
    var $inCart = $('<span hidden class="in-cart">in cart</span>');
    var $purchased = $('<span hidden class="purchased">purchased</span>');
    var $quarantined = $('<span hidden class="quarantined">quarantined</span>')
    var $unavailable = $('<span hidden class="unavailable">unavailable</span>')
    var $alreadyHave = $(`<span hidden class="already-have">don't need</span>`)
    $li.append($dataSpan).append($deleteButton).append($inCart)
      .append($purchased).append($quarantined).append($unavailable).append($alreadyHave)
    $groceryItems.show().append($li);
    if (groceryItem.data.hasOwnProperty('state')) {
      updateState(groceryItem.key, groceryItem.data.state);
    }
    $deleteButton.click(function () {
      deleteGroceryItem($(this));
    });
    $dataSpan.click(function () {
      changeState($(this));
    });
    $('#no_items').hide();
  });
  var removeGroceryItem = function ($groceryItem) {
    $groceryItem.each(function () {
      $(this).remove();
    });
    if ($(".purchased").filter(":visible").size() > 0) {
      $('#delete_purchased').show();
    } else {
      $('#delete_purchased').hide();
    }
    if ($(".in-cart").filter(":visible").size() > 0) {
      $('#purchase_cart').show();
    } else {
      $('#purchase_cart').hide();
    }
    var $groceryItems = $('#grocery-items');
    if ($groceryItems.find('li').length < 1) {
      $groceryItems.hide();
      $('#no_items').show();
    }
  };
  server.on('remove grocery item', function (groceryKey) {
    console.log("received 'remove grocery item' from server for " + groceryKey);
    var $groceryItem = $('#grocery-items').find("[data-key='" + groceryKey + "']");
    removeGroceryItem($groceryItem);
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
  $('#delete_purchased').click(function () {
    $(".purchased").filter(":visible").each(function () {
      deleteGroceryItem($(this));
    });
  });
  $('#purchase_cart').click(function () {
    $(".in-cart").filter(":visible").each(function () {
      changeState($(this));
    });
  });
});
