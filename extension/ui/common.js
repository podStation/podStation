function formatDate(date) {
	return date.toLocaleDateString();
}

$(document).ready(function(){
	$('#colorScheme').on('click',function(){
		if($('body').hasClass('dark-scheme')){
			$('body').removeClass('dark-scheme');
		}else{
			$('body').addClass('dark-scheme');
		}
	});
})