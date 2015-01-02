$(document).ready(function() {

	var publicationsJSON = [],
		authorsJSON = [];

	$.get("http://localhost:3000/mortifier", function(data) {
		if(data.bool){
			publicationsJSON = data.publications;
			authorsJSON = data.authors;
			$('img').hide();
			$('#publications').val(JSON.stringify(data.publications)).show();
			$('#authors').val(JSON.stringify(data.authors)).show();
		}else{
			$('img').hide();
			$('#publications').val(data.msg).show();
		}
	})


});
	