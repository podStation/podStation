function byPubDateDescending(a, b){
	var dateA = new Date(a.pubDate);
	var dateB = new Date(b.pubDate);
	return dateB - dateA;
}
