function messageServiceMockFn() {
	this.for = function() {
		return {
			onMessage: function() { return this },
			sendMessage: function() { return this }
		}
	}
}

export default messageServiceMockFn;