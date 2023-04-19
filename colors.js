const fs = require('fs');
const path = require('path');
const ColorThief = require('colorthief');

async function updateColors(jobs) {
	for (const job of jobs) {
		for (const cooldown of job.cooldowns) {
			const filename = path.resolve(__dirname, "public", cooldown.icon);
			const color = await ColorThief.getColor(filename);
			console.log(`${cooldown.name}: ${color}`);
			cooldown.color = color.join(',');
		}
	}
}

(async function run() {
	const json = fs.readFileSync(path.resolve(__dirname, 'src/data/jobs.json'), 'utf-8');
	const jobs = JSON.parse(json);
	await updateColors(jobs);
	const newJson = JSON.stringify(jobs, undefined, '\t');
	fs.writeFileSync(path.resolve(__dirname, 'src/data/jobs_updated.json'), newJson, 'utf-8');
})();
