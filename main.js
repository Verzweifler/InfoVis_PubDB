$(document).ready(function() {

	var publicationsJSON = []
		authorsJSON = [];
	


	$.get("http://localhost:3000/publications", function(data) {
		$('#publications').val(JSON.stringify(data)).show();
		$('img').hide();
	 })


});
	