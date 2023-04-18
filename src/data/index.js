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
	fights.set(fight.id, {
		...fight,
		duration: time(...fight.duration),
		timeline: fight.timeline.map((marker, i) => ({
			...marker,
			id: i,
			time: time(...marker.time),
		})),
	})
}

export function getJob(jobId) {
	return jobs.get(jobId);
}

export function getCooldown(cooldownId) {
	return cooldowns.get(cooldownId);	
}

export function getFight(fightId) {
	return fights.get(fightId);
}

function toId(str) {
	return str.toLowerCase().replace(/\s+/, '-')
}

function time(mins, secs) {
	return mins * 60000 + secs * 1000;
}
