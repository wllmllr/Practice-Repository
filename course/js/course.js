function progressBar(steps, step) {
	var i, width = (99 / steps.length).toFixed(2), html = '', text, back, objc;
	for (i = 0; i < steps.length; i++) {
		objc = typeof steps[i] === 'object';
		if (i <= (step - 1)) {text = '#fff'; back = objc ? (steps[i][2] || '#968F85') : '#968F85'; } else {text = '#000'; back = objc ? (steps[i][1] || '#E4D9C9') : '#E4D9C9'; }
		html +=
			'<div class="Step" style="width: ' + width + '%; color: ' + text + '; background-color: ' + back + '; z-index: ' + (steps.length - i) + ';">' +
			(objc ? steps[i][0] : steps[i]) + (i < (steps.length - 1) ? '<div class="Arrow"><div class="Arrow-Head"><div style="border-color: transparent transparent transparent ' + back + ';"></div></div></div>' : '') +
			'</div>';
    }
    return '<div class="ProgressBar">' + html + '</div>';
}