$(function () {
  var server = io.connect(window.location.href);
  server.on('connect', function(){
  });
  server.on('new grocery item', function(new_grocery_item){
    $('#list_items').show().append('<li>' + new_grocery_item + '</li>');
    $('#no_items').hide();
  });
  $('#new_item_form').submit(function(e){
    e.preventDefault();
    var $new_item_input = $('#new_item_input');
    var new_item = $new_item_input.val();
    if (new_item.length > 0) {
      server.emit('new grocery item', $new_item_input.val());
      $new_item_input.val('');
    }
  });
});