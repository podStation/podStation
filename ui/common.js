function formatDate(date) {
	var formattedDate = '';

	formattedDate = date.getDate() + '/' + ( date.getMonth() + 1 ) + '/' + date.getFullYear();
	return formattedDate;
}
