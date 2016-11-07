module.exports = draggable;

function draggable(element, options) {
	if (!(this instanceof draggable)) return new draggable(element);
	this.element = element;
	this._defaults = {
		contained: false,
		pens: false,
		vertical: true,
		horizontal: true,
		disabled: false
	};
	var extend = function (a, b) {
		for(var key in b) {
			if (b.hasOwnProperty(key)) {
				a[key] = b[key];
			}
		}
		return a;
	}
	this._options = extend(this._defaults, options);
	this._parent = (this._options.contained) ? this.element.parentNode: window;
	this._roam = (this._options.roam  !== undefined) ? this._options.roam : true;
	this._contained = (this._options.contained !== undefined) ? this._options.contained : false;
	this._pens = this._options.pens;
	this._disabled = (this._options.disabled !== undefined) ? this._options.disabled : true;
	this._vertical = (this._options.vertical !== undefined) ? this._options.vertical : true;
	this._horizontal = (this._options.horizontal !== undefined) ? this._options.horizontal : true;
	this._ghosting = (this._options.ghosting !== undefined) ? this._options.ghosting : false;
	this._create();
}
draggable.prototype.setPens = function (pens) {
	if (pens) {
		this._pens = pens;
	}
}
draggable.prototype.setDisabled = function (disabled) {
	if (disabled !== undefined) {
		this._disabled = disabled;
	}
}
draggable.prototype.setContained = function (contained) {
	if (contained !== undefined) {
		this._contained = contained;
	}
}
draggable.prototype.setRoam = function (roam) {
	if (roam !== undefined) {
		this._roam = roam;
	}
}
draggable.prototype.setVertical = function (vertical) {
	if (vertical !== undefined) {
		this._vertical = vertical;
	}
}
draggable.prototype.setHorizontal = function (horizontal) {
	if (horizontal !== undefined) {
		this._horizontal = horizontal;
	}
}
draggable.prototype.setGhosting = function (ghosting) {
	if (ghosting !== undefined) {
		this._ghosting = ghosting;
	}
}
draggable.prototype._create = function () {
	var draggable = this,
		ghost,
		drag = function (event) {
			//TODO: really cool that on move here you could almost make online paint, didn't even think of that.
			// ghost = draggable.element.cloneNode();
			// ghost.style.opacity = 0.5;
			// document.querySelector('body').appendChild(ghost);
			draggable.element.style.position = 'absolute';
			draggable._newY = event.clientY - draggable._offY;
			draggable._newX = event.clientX - draggable._offX;
			if (draggable._contained) {	
				if (draggable._newX < draggable._boundsXL) {
					draggable._newX = draggable._boundsXL;
				}
				if (draggable._newX > draggable._boundsXR) {
					draggable._newX = draggable._boundsXR;
				}
				if (draggable._newY > draggable._boundsXB) {
					draggable._newY = draggable._boundsXB;
				}
				if (draggable._newY < draggable._boundsXT) {
					draggable._newY = draggable._boundsXT;
				}
			}
			if (draggable._horizontal) {
				draggable.element.style.left = draggable._newX + 'px';
			}
			if (draggable._vertical) {
				draggable.element.style.top = draggable._newY + 'px';
			}
			draggable._parent.addEventListener('dblclick', endDrag);
		},
		endDrag = function () {
			if (draggable._disabled) {
				return false;
			} else {
				if (ghost !== undefined) {
					ghost.remove();
				}
				draggable._parent.removeEventListener('mousemove', drag, true);
				if (draggable._pens && draggable._pens.length > 0) {
					var penned = false,
						currentPen = draggable.element.parentNode,
						isAPen = function (element) {
							for (var i = 0; i <= draggable._pens.length - 1; i++) {
								if (currentPen === draggable._pens[i]) {
									return true;
								}
							};
						};
					for (var i = 0; i < draggable._pens.length; i++) {
						if (draggable._newX < (draggable._pens[i].offsetLeft + draggable._pens[i].offsetWidth) && draggable._newX > (draggable._pens[i].offsetLeft - draggable.element.offsetWidth) && draggable._newY > (draggable._pens[i].offsetTop - draggable.element.offsetHeight) && draggable._newY < (draggable._pens[i].offsetTop + draggable._pens[i].offsetHeight + draggable.element.offsetHeight)) {
							penned = true;
							draggable.element.style.position = '';
							draggable._pens[i].appendChild(draggable.element);
							break;
						}
					};
					if (!penned) {
						if (draggable._roam) {
							document.querySelector('body').appendChild(draggable.element);
						} else {
							if (isAPen(currentPen)) {
								currentPen.appendChild(draggable.element);
								draggable.element.style.position = '';
							}
						}
					}
				}
			}
		},
		startDrag = function (event) {
			if (draggable._disabled) {
				return false;
			} else {
				draggable._offY = event.clientY - parseInt(draggable.element.offsetTop);
				draggable._offX = event.clientX - parseInt(draggable.element.offsetLeft);
				draggable._boundsXR = (draggable._parent.offsetLeft + draggable._parent.offsetWidth) - draggable.element.offsetWidth;
				draggable._boundsXL = draggable._parent.offsetLeft;
				draggable._boundsXT = draggable._parent.offsetTop;
				draggable._boundsXB = (draggable._parent.offsetTop + draggable._parent.offsetHeight) - draggable.element.offsetHeight;
				if (draggable._ghosting) {
					ghost = draggable.element.cloneNode();
					draggable.element.parentNode.appendChild(ghost);
					ghost.style.opacity = 0.2;
					ghost.style.position = 'absolute';
					ghost.style.left = draggable.element.offsetLeft + 'px';
					ghost.style.top = draggable.element.offsetTop + 'px';
				}	
				draggable._parent.addEventListener('mousemove', drag, true);
			}
		};
	draggable.element.addEventListener('mousedown', startDrag, false);
    	draggable.element.addEventListener('mouseup', endDrag, false);
}
