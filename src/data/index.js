import fightsJson from './fights.json';
import jobsJson from './jobs.json';

const jobs = new Map();
const cooldowns = new Map();
const fights = new Map();

for (const job of jobsJson) {
	const cds = job.cooldowns.map(cd => ({
		...cd,
		id: toId(`${job.id}-${cd.name}`),
		recast: time(0, cd.recast),
		duration: time(0, cd.duration),
	}));

	jobs.set(job.id, {
		...job,
		cooldowns: cds,
	});

	for (const cd of cds) {
		cooldowns.set(cd.id, cd);
	}
}

for (const fight of fightsJson) {
	const duration = parseEventTime(fight.timeline[fight.timeline.length-1].time).start + 10000;

	fights.set(fight.id, {
		...fight,
		duration,
		timeline: fight.timeline.map((marker, i) => {
			const { start, end } = parseEventTime(marker.time);
			const attack = fight.attacks[marker.name];
			const type = attack?.type || 'default';
			const name = attack?.short || marker.name;
			const title = `${start / 60000 | 0}:${String((start % 60000) / 1000 | 0).padStart(2, '0')} ${marker.name}`;
			const id = `${type}-${i}`;
			return { id, type, name, title, start, end };
		}),
	})
}

function parseEventTime(str) {
	const [start, end] = str.split('-');
	return { start: _parseEventTime(start), end: end && _parseEventTime(end) };
	
	function _parseEventTime(str) {
		const [m, s, ms] = /^(\d+):(\d+).(\d+)$/.exec(str).slice(1).map(x => parseInt(x, 10));
		return 60000*m + 1000*s + ms;
	}
}

export function isJob(jobId) {
	return jobs.has(jobId);
}

export function getJob(jobId) {
	return jobs.get(jobId);
}

export function isCooldown(cooldownId) {
	return cooldowns.has(cooldownId);
}

export function getCooldown(cooldownId) {
	return cooldowns.get(cooldownId);	
}

export function getFight(fightId) {
	return fights.get(fightId);
}

function toId(str) {
	return str.toLowerCase().replace(/\s+/g, '-')
}

function time(mins, secs) {
	return mins * 60000 + secs * 1000;
}
