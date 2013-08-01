// Saves options to localStorage.
function save_options() {
  localStorage["serviceHostName"] = $('#serviceHostName').val();
  // Update status to let user know options were saved.
  $('#status').html("Options Saved");
  setTimeout(function() {
	$('#status').html("");
  }, 750);
}
// Restores select box state to saved value from localStorage.
function restore_options() {
  var hostName = localStorage["serviceHostName"];
  if (!hostName) {
    return;
  }
  $('#serviceHostName').val(hostName);
}

$(function() {
	$('#save-bn').click(function() { save_options(); });
	restore_options();
});
