var leave = false;
window.onblur = () => {
	leave = true;
}
window.onfocus = () => {
	if (leave) {
		location.reload();
	}
}
