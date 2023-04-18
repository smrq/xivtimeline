export function toId(str) {
	return str.toLowerCase().replace(/\s+/, '-')
}

export function time(mins, secs) {
	return mins * 60000 + secs * 1000;
}

export function setMarker(timeline, name, time, id) {
  timeline.addCustomTime(time, id);
  timeline.setCustomTimeMarker(name, id);
}
