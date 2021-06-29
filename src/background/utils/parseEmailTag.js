/**
 * A very cheap email tag parser, does not support mailto links
 * e-mail tags do not have a well defined format :(
 * see 
 * @param {string} tagContent
 * @returns {string} returns a string containing an e-mail
 */
 function parseEmailTag(tagContent) {
	let email = undefined;
	
	if(tagContent) {
		let e = tagContent.split(' ');

		if(e[0] !== 'noreply@blogger.com') {
			email = e[0];
		}
	}
	
	return email;
}

export default parseEmailTag;